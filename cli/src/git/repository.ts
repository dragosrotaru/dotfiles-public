import fs from "fs";
import path from "path";
import { execAsync, execGitAsync } from "../util/exec";

export class GitRepository {
    constructor(public path: string) {}

    /**
     * Retrieves the number of unpushed commits per local branch for the specified Git repository.
     *
     * @returns A Promise that resolves with an object mapping branch names to their corresponding unpushed commit counts.
     */
    getUnpushedCommitsPerBranch = async (): Promise<{
        [branch: string]: number;
    }> => {
        const branches = await execGitAsync(
            // eslint-disable-next-line quotes
            'git branch --format="%(refname:short)"',
            this.path
        );

        const out: { [key: string]: number } = {};

        await Promise.all(
            branches.map(async (branch) => {
                out[branch] = parseInt(
                    (
                        await execGitAsync(
                            `git rev-list --count @{u}..${branch}`,
                            this.path
                        )
                    )[0] as string,
                    10
                );
            })
        );

        return out;
    };

    /**
     * Retrieves a list of files with uncommitted changes for the specified Git repository.
     
     * @returns A Promise that resolves with an array of files with uncommitted changes.
     */
    getUncommittedFiles = async (): Promise<string[]> =>
        (await execGitAsync("git status --short", this.path)).map(
            (line) => line.trim().slice(3) // Remove the status flags from the line
        );

    /**
     * Retrieves a list of Git branches that have unpulled commits.
     * @returns A Promise that resolves to an array of strings representing the branch names.
     */
    getBranchesWithUnpulledCommits = async (): Promise<string[]> =>
        (
            await execGitAsync(
                "git branch -vv --format='%(refname:short)'",
                this.path
            )
        )
            .filter(
                (line) =>
                    line.includes(": [ahead") || line.includes(": [behind")
            )
            .map((line) => (line.split(":")[0] as string).trim());

    /**
     * Retrieves a list of Git branches that have been deleted in the upstream repository.
     * @returns A Promise that resolves to an array of strings representing the branch names.
     */
    getDeletedUpstreamBranches = async (): Promise<string[]> =>
        (
            await execGitAsync(
                "git branch -vv --format='%(refname:short)'",
                this.path
            )
        )
            .filter((line) => line.includes(": gone]"))
            .map((line) => (line.split(":")[0] as string).trim());

    /**
     * Retrieves a list of files with merge conflicts.
     * @returns A Promise that resolves to an array of strings representing the file paths.
     */
    getFilesWithMergeConflicts = async (): Promise<string[]> =>
        execGitAsync("git diff --name-only --diff-filter=U", this.path);

    /**
     * Retrieves the commit IDs related to merge conflicts in a specific file.
     * @param file - The path to the file.
     * @returns A Promise that resolves to an array of strings representing the commit IDs.
     */
    getCommitsForMergeConflicts = async (file: string): Promise<string[]> => {
        const commits = (
            await execGitAsync(
                `git blame -L '/^<<<</,/^=====/' -- "${file}"`,
                this.path
            )
        )
            .filter((line) => !line.startsWith("00000"))
            .map((line) => line.split(" ")[0] as string);

        return [...new Set<string>(commits)];
    };

    /**
     * Retrieves the authors related to merge conflicts in a specific file.
     * @param file - The path to the file.
     * @returns A Promise that resolves to an array of strings representing the authors.
     */
    getAuthorsForMergeConflicts = async (file: string): Promise<string[]> => {
        const authors = (
            await execGitAsync(
                `git blame -L '/^<<<</,/^====/' --porcelain -- "${file}"`,
                this.path
            )
        )
            .filter(
                (line) =>
                    line.startsWith("author ") &&
                    !line.includes("author Not Committed Yet")
            )
            .map((line) => line.slice(7));
        return [...new Set(authors)];
    };

    /**
     * Retrieves and displays information about merge conflicts in files.
     * This function prints the file path, commit IDs, and authors related to merge conflicts in each file.
     */
    blameMergeConflicts = async () => {
        const conflictFiles = await this.getFilesWithMergeConflicts();

        const blame: {
            [file: string]: {
                file: string;
                commit: string[];
                author: string[];
            };
        } = {};

        for (const file of conflictFiles) {
            const commit = await this.getCommitsForMergeConflicts(file);
            const author = await this.getAuthorsForMergeConflicts(file);
            blame[file] = { file, commit, author };
        }
        return blame;
    };

    /**
     * Retrieves a list of all files tracked by the Git repository.
     * @returns A Promise that resolves to an array of strings representing the file paths.
     */
    getAllTrackedFiles = async (): Promise<string[]> =>
        await execGitAsync("git ls-files", this.path);
}

/**
 * Checks if a file or directory should be ignored according to the rules specified in .gitignore files.
 * It searches for .gitignore files in parent directories and checks if the given file or directory matches any of the ignore patterns.
 * @param path - The path to the file or directory.
 * @returns A Promise that resolves to a boolean value indicating whether the file or directory should be ignored.
 */
export const isIgnored = async (path: string): Promise<boolean> => {
    try {
        await execAsync(`git check-ignore -q "${path}"`);
        return false;
    } catch (error) {
        return true;
    }
};

/**
 * Checks if the specified directory is a Git repository.
 *
 * @param directoryPath - The path of the directory to check.
 * @returns A boolean indicating whether the directory is a Git repository or not.
 */
export const naiveIsGitRepo = (directoryPath: string): boolean =>
    fs.existsSync(path.join(directoryPath, ".git"));
