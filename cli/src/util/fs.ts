import crypto from "crypto";
import fs from "fs";
import path from "path";
import { handle } from "./exec";

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
 * reads the file and returns its SHA256 hash
 * @param filePath
 */
export const getHash = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);

        stream.on("error", (error) => {
            reject(error);
        });

        stream.on("data", (data) => {
            hash.update(data);
        });

        stream.on("end", () => {
            const fileHash = hash.digest("hex");
            resolve(fileHash);
        });
    });
};

/**
 * Accepts a directory and returns a list of all file paths in the directory
 * and its subdirectories relative to the directory path, excluding directories.
 *
 * @param directoryPath - The path to the directory.
 * @returns A promise that resolves to an array of file paths.
 */
export const getAllFilePaths = async (
    directoryPath: string
): Promise<string[]> => {
    const filePaths: string[] = [];
    const stack: string[] = [directoryPath];

    while (stack.length > 0) {
        const currentPath = stack.pop();
        if (!currentPath) continue;

        const files = await fs.promises.readdir(currentPath, {
            withFileTypes: true,
        });

        for (const file of files) {
            const filePath = path.join(currentPath, file.name);

            if (file.isFile()) {
                const relativePath = path.relative(directoryPath, filePath);
                filePaths.push(relativePath);
            } else if (file.isDirectory()) {
                stack.push(filePath);
            }
        }
    }

    return filePaths;
};

export class FSError extends Error {}
export class ParseError extends Error {}

export class JsonFile<Data> {
    data: Data | null;
    constructor(public path: string) {}
    /**
     * Returns file data
     */
    public async load(): Promise<Data | FSError | ParseError> {
        const file = await handle(
            () => fs.promises.readFile(this.path, "utf-8"),
            (e) => e
        );
        if (file instanceof Error) return new FSError(file.message);
        const data = handle(
            // TODO validate structure
            () => JSON.parse(file) as Data,
            (e) => new ParseError(e.message)
        );
        return data;
    }

    /**
     * Saves data to file
     */
    public async save(data: Data): Promise<void | FSError> {
        return handle(
            () => fs.promises.writeFile(this.path, JSON.stringify(data)),
            (e) => new FSError(e.message)
        );
    }
}

/**
 * Returns file data
 */
export const load = async <Data>(
    path: string,
    validator: (data: unknown) => Data
): Promise<Data | FSError | ParseError> => {
    const file = await handle(
        () => fs.promises.readFile(path, "utf-8"),
        (e) => e
    );
    if (file instanceof Error) return new FSError(file.message);
    const data = handle(
        // TODO validate structure
        () => validator(JSON.parse(file)),
        (e) => new ParseError(e.message)
    );
    return data;
};

/**
 * Saves data to file
 */
export const save = async <Data>(
    path: string,
    data: Data
): Promise<void | FSError> => {
    return handle(
        () => fs.promises.writeFile(path, JSON.stringify(data)),
        (e) => new FSError(e.message)
    );
};
