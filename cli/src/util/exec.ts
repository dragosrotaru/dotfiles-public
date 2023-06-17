import { exec } from "child_process";
import util from "util";

export const execAsync = util.promisify(exec);

export const execGitAsync = async (command: string, repo: string) => {
    const { stdout, stderr } = await execAsync(command, { cwd: repo });

    if (stderr) {
        throw new Error(stderr);
    }

    return stdout.trim().split("\n");
};

export function handle<
    E extends Error,
    F extends () => any,
    H extends (error: Error) => E
>(func: F, err: H): ReturnType<F> | ReturnType<H> | Error {
    try {
        return func();
    } catch (error: any) {
        return err(error);
    }
}
