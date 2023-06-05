// TODO improve performance by running these in parallel or memoizing
// TODO add tests

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

export const execAsync = util.promisify(exec);

export const execGitAsync = async (command: string, repo: string) => {
    const { stdout, stderr } = await execAsync(command, { cwd: repo });

    if (stderr) {
        throw new Error(stderr);
    }

    return stdout.trim().split("\n");
};

/**
 * Counts the number of items in a directory.
 *
 * @param directoryPath - The path to the directory.
 * @returns The number of items in the directory.
 */
export const countItemsInDirectory = (directoryPath: string): number =>
    fs.readdirSync(directoryPath).length;

/**
 * Checks if the specified path is a directory.
 *
 * @param filePath - The path to check.
 * @returns A boolean indicating whether the path is a directory or not.
 */
export const isDirectory = (filePath: string): boolean =>
    fs.statSync(filePath).isDirectory();

/**
 * Checks if the specified directory is a Git repository.
 *
 * @param directoryPath - The path of the directory to check.
 * @returns A boolean indicating whether the directory is a Git repository or not.
 */
export const isGitRepo = (directoryPath: string): boolean =>
    fs.existsSync(path.join(directoryPath, ".git"));

/**
 * Recursively finds Git repositories within the specified directory path.
 *
 * @param directoryPath - The path of the directory to search in.
 * @returns An array of strings representing the paths of Git repositories.
 */
export const getAllGitRepos = (directoryPath: string): string[] => {
    const repositories: string[] = [];

    /**
     * Recursively traverses the directory structure and adds Git repositories to the result array.
     *
     * @param dir - The current directory to explore.
     */
    const traverseDirectory = (dir: string) => {
        if (!isDirectory(dir)) return;

        if (isGitRepo(dir)) {
            repositories.push(dir);
            return;
        }

        fs.readdirSync(dir).forEach((subdir) =>
            traverseDirectory(path.join(dir, subdir))
        );
    };

    traverseDirectory(directoryPath);
    return repositories;
};

/**
 * Executes the 'git fetch' command for all Git repositories found within the specified directory path.
 *
 * @param directoryPath - The path of the directory to search in.
 * @returns A Promise that resolves when all fetch operations have completed.
 */
export const fetchAllRepos = async (directoryPath: string) =>
    Promise.all(
        getAllGitRepos(directoryPath).map((cwd) =>
            execAsync("git fetch", { cwd })
        )
    );

/**
 * Retrieves the number of unpushed commits per local branch for all Git repositories found within the specified directory path.
 *
 * @param directoryPath - The path of the directory to search in.
 * @returns A Promise that resolves with an object mapping repository paths to an object with branch names and their corresponding unpushed commit counts.
 */
export const getAllUnpushedCommitsPerBranch = async (
    directoryPath: string
): Promise<{ [repository: string]: { [branch: string]: number } }> => {
    const gitRepositories = getAllGitRepos(directoryPath);
    const unpushedCommitsPerBranch: {
        [repository: string]: { [branch: string]: number };
    } = {};

    // Get unpushed commits per branch for repositories
    for (const repo of gitRepositories) {
        const unpushedCommitsByBranch = await getUnpushedCommitsPerBranch(repo);
        unpushedCommitsPerBranch[repo] = unpushedCommitsByBranch;
    }

    return unpushedCommitsPerBranch;
};

/**
 * Retrieves a list of every file with uncommitted changes per Git repository found within the specified directory path.
 *
 * @param directoryPath - The path of the directory to search in.
 * @returns A Promise that resolves with an object mapping repository paths to arrays of files with uncommitted changes.
 */
export const getAllUncommittedFilesPerRepo = async (
    directoryPath: string
): Promise<{ [repository: string]: string[] }> => {
    const gitRepositories = getAllGitRepos(directoryPath);
    const uncommittedFilesPerRepo: { [repository: string]: string[] } = {};

    // Get uncommitted files for repositories
    for (const repo of gitRepositories) {
        const uncommittedFiles = await getUncommittedFiles(repo);
        uncommittedFilesPerRepo[repo] = uncommittedFiles;
    }

    return uncommittedFilesPerRepo;
};

/**
 * Retrieves every directory within directoryPath that is not inside a Git repository and does not contain any Git repositories.
 * Also includes every file that is not inside a Git repository. Only considers repositories starting from the specified directory path,
 * cannot find repositories that are outside of the specified directory path. Does not consider submodules.
 *
 * @param directoryPath - The path of the directory to search in.
 * @returns An array of directory paths and file paths that meet the conditions.
 */
export const getAllNotInRepo = (directoryPath: string): string[] => {
    if (!isDirectory(directoryPath)) {
        throw new Error(`Path ${directoryPath} is not a directory`);
    }

    const gitRepositories = getAllGitRepos(directoryPath);
    const output: string[] = [];

    const containsGitRepo = (directory: string): boolean =>
        gitRepositories.some((repo) => repo.startsWith(directory));

    const isInsideGitRepo = (directory: string): boolean =>
        gitRepositories.some(directory.startsWith);

    const traverseDirectory = (dir: string) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);

            if (isDirectory(filePath)) {
                if (gitRepositories.includes(filePath)) {
                    return;
                }
                // in case that the root directory is a git repo
                if (isInsideGitRepo(filePath)) {
                    return;
                }

                // Recurse
                if (containsGitRepo(filePath)) {
                    traverseDirectory(filePath);
                    return;
                }

                output.push(filePath);
                return;
            }

            // Files
            if (!isInsideGitRepo(filePath)) {
                output.push(filePath);
            }
        }
    };

    traverseDirectory(directoryPath);

    return output;
};

/**
 * Retrieves the number of unpushed commits per local branch for the specified Git repository.
 *
 * @param repository - The path of the Git repository.
 * @returns A Promise that resolves with an object mapping branch names to their corresponding unpushed commit counts.
 */
export const getUnpushedCommitsPerBranch = async (
    repository: string
): Promise<{ [branch: string]: number }> => {
    const branches = await execGitAsync(
        // eslint-disable-next-line quotes
        'git branch --format="%(refname:short)"',
        repository
    );

    const out: { [key: string]: number } = {};

    await Promise.all(
        branches.map(async (branch) => {
            out[branch] = parseInt(
                (
                    await execGitAsync(
                        `git rev-list --count @{u}..${branch}`,
                        repository
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
 *
 * @param repository - The path of the Git repository.
 * @returns A Promise that resolves with an array of files with uncommitted changes.
 */
export const getUncommittedFiles = async (
    repository: string
): Promise<string[]> =>
    (await execGitAsync("git status --short", repository)).map(
        (line) => line.trim().slice(3) // Remove the status flags from the line
    );

/**
 * Retrieves a list of Git branches that have unpulled commits.
 * @returns A Promise that resolves to an array of strings representing the branch names.
 */
export const getBranchesWithUnpulledCommits = async (
    repository: string
): Promise<string[]> =>
    (
        await execGitAsync(
            "git branch -vv --format='%(refname:short)'",
            repository
        )
    )
        .filter(
            (line) => line.includes(": [ahead") || line.includes(": [behind")
        )
        .map((line) => (line.split(":")[0] as string).trim());

/**
 * Retrieves a list of Git branches that have been deleted in the upstream repository.
 * @returns A Promise that resolves to an array of strings representing the branch names.
 */
export const getDeletedUpstreamBranches = async (
    repository: string
): Promise<string[]> =>
    (
        await execGitAsync(
            "git branch -vv --format='%(refname:short)'",
            repository
        )
    )
        .filter((line) => line.includes(": gone]"))
        .map((line) => (line.split(":")[0] as string).trim());

/**
 * Retrieves a list of files with merge conflicts.
 * @returns A Promise that resolves to an array of strings representing the file paths.
 */
export const getFilesWithMergeConflicts = async (
    repository: string
): Promise<string[]> =>
    execGitAsync("git diff --name-only --diff-filter=U", repository);

/**
 * Retrieves the commit IDs related to merge conflicts in a specific file.
 * @param file - The path to the file.
 * @returns A Promise that resolves to an array of strings representing the commit IDs.
 */
export const getCommitsForMergeConflicts = async (
    repository: string,
    file: string
): Promise<string[]> => {
    const commits = (
        await execGitAsync(
            `git blame -L '/^<<<</,/^=====/' -- "${file}"`,
            repository
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
export const getAuthorsForMergeConflicts = async (
    repository: string,
    file: string
): Promise<string[]> => {
    const authors = (
        await execGitAsync(
            `git blame -L '/^<<<</,/^====/' --porcelain -- "${file}"`,
            repository
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
export const blameMergeConflicts = async (repository: string) => {
    const conflictFiles = await getFilesWithMergeConflicts(repository);

    for (const file of conflictFiles) {
        const commit = await getCommitsForMergeConflicts(repository, file);
        const author = await getAuthorsForMergeConflicts(repository, file);

        console.log(file);
        console.log(commit);
        console.log(author);
    }
};

/**
 * Retrieves a list of all files tracked by the Git repository.
 * @returns A Promise that resolves to an array of strings representing the file paths.
 */
export const getAllTrackedFiles = async (
    repository: string
): Promise<string[]> => await execGitAsync("git ls-files", repository);

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
