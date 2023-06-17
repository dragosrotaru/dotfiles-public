import fs from "fs";
import path from "path";
import { execAsync } from "../util/exec";
import { isDirectory } from "../util/fs";
import { GitConfig } from "./config";
import { GitRepository, isIgnored, naiveIsGitRepo } from "./repository";

export class GitRepositoryManager {
    repositories: GitRepository[] | undefined;
    constructor(public config: GitConfig) {
        if (!isDirectory(config.rootDir)) {
            throw new Error(`Path ${config.rootDir} is not a directory`);
        }
    }

    /**
     * Recursively finds Git repositories within the specified directory path.
     *
     * @returns An array of strings representing the paths of Git repositories.
     */
    getAllGitRepos = (): GitRepository[] => {
        if (this.repositories) return this.repositories;

        this.repositories = [];

        /**
         * Recursively traverses the directory structure and adds Git repositories to the result array.
         *
         * @param dir - The current directory to explore.
         */
        const traverseDirectory = (dir: string) => {
            if (!isDirectory(dir)) return;

            if (naiveIsGitRepo(dir)) {
                this.repositories?.push(new GitRepository(dir));
                return;
            }

            fs.readdirSync(dir).forEach((subdir) =>
                traverseDirectory(path.join(dir, subdir))
            );
        };

        traverseDirectory(this.config.rootDir);
        return this.repositories;
    };

    /**
     * Executes the 'git fetch' command for all Git repositories found within the specified directory path.
     *
     * @returns A Promise that resolves when all fetch operations have completed.
     */
    fetchAllRepos = async () =>
        Promise.all(
            this.getAllGitRepos().map((repo) =>
                execAsync("git fetch", { cwd: repo.path })
            )
        );

    /**
     * Retrieves the number of unpushed commits per local branch for all Git repositories found within the specified directory path.
     *
     * @returns A Promise that resolves with an object mapping repository paths to an object with branch names and their corresponding unpushed commit counts.
     */
    getAllUnpushedCommitsPerBranch = async (): Promise<{
        [repository: string]: { [branch: string]: number };
    }> => {
        const gitRepositories = this.getAllGitRepos();
        const unpushedCommitsPerBranch: {
            [repository: string]: { [branch: string]: number };
        } = {};

        // Get unpushed commits per branch for repositories
        for (const repo of gitRepositories) {
            const unpushedCommitsByBranch =
                await repo.getUnpushedCommitsPerBranch();
            unpushedCommitsPerBranch[repo.path] = unpushedCommitsByBranch;
        }

        return unpushedCommitsPerBranch;
    };

    /**
     * Retrieves a list of every file with uncommitted changes per Git repository found within the specified directory path.
     *
     * @param directoryPath - The path of the directory to search in.
     * @returns A Promise that resolves with an object mapping repository paths to arrays of files with uncommitted changes.
     */
    getAllUncommittedFilesPerRepo = async (): Promise<{
        [repository: string]: string[];
    }> => {
        const gitRepositories = this.getAllGitRepos();
        const uncommittedFilesPerRepo: { [repository: string]: string[] } = {};

        // Get uncommitted files for repositories
        for (const repo of gitRepositories) {
            const uncommittedFiles = await repo.getUncommittedFiles();
            uncommittedFilesPerRepo[repo.path] = uncommittedFiles;
        }

        return uncommittedFilesPerRepo;
    };

    /**
     * Retrieves every directory within directoryPath that is not inside a Git repository and does not contain any Git repositories.
     * Also includes every file that is not inside a Git repository. Only considers repositories starting from the specified directory path,
     * cannot find repositories that are outside of the specified directory path. Does not consider submodules.
     *
     * @returns An array of directory paths and file paths that meet the conditions.
     */
    getAllNotInRepo = (): string[] => {
        const gitRepositories = this.getAllGitRepos();
        const output: string[] = [];

        const containsGitRepo = (directory: string): boolean =>
            gitRepositories.some((repo) => repo.path.startsWith(directory));

        const isInsideGitRepo = (directory: string): boolean =>
            gitRepositories.some((repo) => directory.startsWith(repo.path));

        const traverseDirectory = (dir: string) => {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);

                if (isDirectory(filePath)) {
                    if (
                        gitRepositories
                            .map((repo) => repo.path)
                            .includes(filePath)
                    ) {
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

        traverseDirectory(this.config.rootDir);

        return output;
    };

    analysis = async () => {
        await this.fetchAllRepos();

        const unpushed = await this.getAllUnpushedCommitsPerBranch();
        const uncommited = await this.getAllUncommittedFilesPerRepo();

        const dotFiles = new GitRepository(config.dotfilesPath);

        const trackedInDotfiles = await dotFiles.getAllTrackedFiles();
        const untracked = (await this.getAllNotInRepo()).filter(
            async (file) =>
                !(await isIgnored(file)) && !trackedInDotfiles.includes(file)
        );
        return { unpushed, uncommited, untracked };
    };
}
