import {
    HeadObjectCommand,
    ListObjectsCommand,
    NotFound,
    S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "crypto";
import fs from "fs";
import notifier from "node-notifier";
import path from "path";
import { z } from "zod";
import { handle } from "../util/exec";
import { FSError, ParseError, getHash, load, save } from "../util/fs";
import { S3BackupConfig, filepaths } from "./config";
import { Errors, FileMeta, Operation, Procedures, Status } from "./types";

const InventorySchema = z.record(
    z.object({
        path: z.string(),
        hash: z.string(),
        size: z.number(),
        lastModified: z.string(),
    })
);
type Inventory = z.infer<typeof InventorySchema>;

export class S3Backup {
    id = randomUUID().slice(0, 8);
    inventoryPath: string;
    processLogPath: string;
    filesLogPath: string;

    stats = {
        // General Stats
        files: 0,
        directories: 0,
        megaBytes: 0,
        start: "",
        finish: "",

        // Time
        inventoryTime: 0,
        processTime: 0,

        // Total Errors
        error: 0,

        // General Errors
        hashError: 0,
        statError: 0,
        serverStatusError: 0,
        uploadError: 0,

        // Sync Errors
        createExistsError: 0,
        createExistsAndDifferentError: 0,
        replaceSameError: 0,
        replaceNotFoundError: 0,

        // Successful Operations
        noop: 0,
        create: 0,
        replace: 0,
    };

    client: S3Client;

    constructor(private config: S3BackupConfig) {
        // TODO refactor move out to its own module
        if (this.config.credentials) {
            process.env["AWS_PROFILE"] = this.config.credentials;
        }
        this.client = new S3Client({});
        const paths = filepaths(this.config);
        this.inventoryPath = paths.inventory;
        this.processLogPath = paths.processLog;
        this.filesLogPath = paths.filesLog;
    }

    /* API Methods */

    public async initialize() {
        const inventory = await this.takeInventory();
        if (inventory instanceof FSError) {
            this.processError(
                Procedures.INITIALIZE,
                Errors.TAKE_INVENTORY,
                inventory.message
            );
            return;
        }
        const save = await this.saveInventory(inventory);
        if (save instanceof FSError) {
            this.processError(
                Procedures.INITIALIZE,
                Errors.SAVE_INVENTORY,
                save.message
            );
        }
    }

    /**
     * Performs a backup.
     */
    public async backup() {
        const start = process.hrtime();

        const inventory = await this.takeInventory();

        if (inventory instanceof FSError) {
            this.processError(
                Procedures.BACKUP,
                Errors.TAKE_INVENTORY,
                inventory.message
            );
            return;
        }

        const last = await this.loadInventory();
        if (last instanceof FSError || last instanceof ParseError) {
            this.processError(
                Procedures.BACKUP,
                Errors.LOAD_INVENTORY,
                last.message
            );
            return;
        }

        const inventoryTime = process.hrtime(start);
        this.stats.inventoryTime = inventoryTime[0];

        const isAvailable = await this.checkS3Connection();
        if (!isAvailable) {
            this.processLog("s3 connection not available");
            process.exit(0);
        }

        const newInventory: Inventory = {};

        for (const [path, item] of Object.entries(inventory)) {
            const lastItem = last[item.path];

            if (lastItem && lastItem.hash === item.hash) {
                await this.fileLog(item, "NOOP", "success");
                this.stats.noop++;
                newInventory[path] = item;
                continue;
            }

            const serverStatus = await this.checkServerStatus(item);
            if (serverStatus instanceof Error) {
                this.stats.serverStatusError++;
                this.fileLog(
                    item,
                    "NOOP",
                    `${Errors.SERVER_STATUS}: ${serverStatus.message}`
                );
            }

            if (lastItem && lastItem.hash !== item.hash) {
                if (serverStatus === Status.SAME) {
                    this.stats.replaceSameError++;
                    this.fileLog(item, "REPLACE", Errors.REPLACE_SAME);
                    continue;
                }
                if (serverStatus === Status.NOT_FOUND) {
                    this.stats.replaceNotFoundError++;
                    this.fileLog(item, "REPLACE", Errors.REPLACE_NOT_FOUND);
                    continue;
                }

                const result = await this.upload(item);
                if (result.$metadata.httpStatusCode === 200) {
                    this.stats.replace++;
                    await this.fileLog(item, "REPLACE", "success");
                } else {
                    this.stats.uploadError++;
                    this.fileLog(
                        item,
                        "REPLACE",
                        `${Errors.UPLOAD} : ${result.$metadata.httpStatusCode}`
                    );
                }
                newInventory[path] = item;
                continue;
            }

            if (!lastItem) {
                if (serverStatus === Status.SAME) {
                    this.stats.createExistsError++;
                    this.fileLog(item, "CREATE", Errors.CREATE_EXISTS);
                    continue;
                }
                if (serverStatus === Status.DIFFERENT) {
                    this.stats.createExistsAndDifferentError++;
                    this.fileLog(
                        item,
                        "CREATE",
                        Errors.CREATE_EXISTS_AND_DIFFERENT
                    );
                    continue;
                }

                const result = await this.upload(item);
                if (result.$metadata.httpStatusCode === 200) {
                    this.stats.create++;
                    await this.fileLog(item, "CREATE", "success");
                } else {
                    this.stats.uploadError++;
                    this.fileLog(
                        item,
                        "CREATE",
                        `${Errors.UPLOAD} : ${result.$metadata.httpStatusCode}`
                    );
                }
                newInventory[path] = item;
                continue;
            }
        }

        const processTime = process.hrtime(inventoryTime);
        this.stats.processTime = processTime[0];

        const save = await this.saveInventory(newInventory);

        console.log(
            `${new Date().toISOString()} stats: ${JSON.stringify(
                this.stats,
                null,
                2
            )}`
        );

        if (save instanceof FSError) {
            this.processError(
                Procedures.BACKUP,
                Errors.SAVE_INVENTORY,
                save.message
            );
        }

        console.log(`${new Date().toISOString()} backup successful`);
        process.exit(0);
    }

    public async restore(
        targetDir: string,
        pattern?: string,
        tag?: string,
        dryRun = false
    ) {
        return new Error("Method not implemented.");
    }

    /* Inventory Methods */

    /**
     * Reads the directory and returns an inventory of all files in the directory.
     */
    private async takeInventory(): Promise<Inventory | FSError> {
        const inventory: Inventory = {};
        const files = await handle(
            () =>
                fs.promises.readdir(this.config.rootDir, {
                    withFileTypes: true,
                    recursive: true,
                }),
            (e) => e
        );
        if (files instanceof Error) return new FSError(files.message);
        try {
            await Promise.all(
                files
                    .filter((file) => {
                        const isFile = file.isFile();
                        if (isFile) this.stats.files++;
                        else this.stats.directories++;
                        return isFile;
                    })
                    .map(async (file) => {
                        const relativePath = path.relative(
                            this.config.rootDir,
                            file.path
                        );
                        const hash = await handle(
                            () => getHash(file.path),
                            (e) => e
                        );
                        if (hash instanceof Error) {
                            this.stats.hashError++;
                            throw new FSError(
                                `${file.path} : ${Errors.HASH} : ${hash.message}`
                            );
                        }
                        const stat = await handle(
                            () => fs.promises.stat(file.path),
                            (e) => e
                        );
                        if (stat instanceof Error) {
                            this.stats.statError++;
                            throw new FSError(
                                `${file.path} : ${Errors.STAT} : ${stat.message}`
                            );
                        }
                        inventory[relativePath] = {
                            path: relativePath,
                            hash,
                            size: stat.size,
                            lastModified: stat.mtime.toISOString(),
                        };
                        this.stats.megaBytes += stat.size / 1_000_000;
                    })
            );
            return inventory;
        } catch (error) {
            return error as FSError;
        }
    }

    /**
     * Returns the inventory from the inventory file.
     */
    private async loadInventory(): Promise<Inventory | FSError | ParseError> {
        return load(this.inventoryPath, InventorySchema.parse);
    }

    /**
     * Saves the inventory to the inventory file.
     */
    private async saveInventory(inventory: Inventory): Promise<void | FSError> {
        return save(this.inventoryPath, inventory);
    }

    /* S3 API Methods */

    private async checkS3Connection() {
        try {
            const res = await this.client.send(
                new ListObjectsCommand({
                    Bucket: this.config.bucket,
                    MaxKeys: 1,
                })
            );
            if (res.$metadata.httpStatusCode !== 200) {
                this.processLog(
                    `${Errors.NETOWRK} : ${res.$metadata.httpStatusCode}`
                );
            }
            return res.$metadata.httpStatusCode === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Checks if the file exists on the server and if it is the same as the local file.
     */
    private async checkServerStatus(file: FileMeta) {
        try {
            const head = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.config.bucket,
                    Key: file.path,
                })
            );
            if (head.ETag === file.hash) {
                return Status.SAME;
            } else {
                return Status.DIFFERENT;
            }
        } catch (error: unknown) {
            if (error instanceof NotFound) {
                return Status.NOT_FOUND;
            } else {
                return error as Error;
            }
        }
    }

    /**
     * Uploads a file to the server
     */
    private async upload(file: FileMeta) {
        const upload = new Upload({
            client: this.client,
            queueSize: 4,
            partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB

            params: {
                Bucket: this.config.bucket,
                StorageClass: "INTELLIGENT_TIERING",
                Key: file.path,
                Body: fs.createReadStream(file.path),
                ChecksumSHA256: file.hash,
            },
        });
        return upload.done();
    }

    /* Log and Error Handling Methods */

    private async processError(
        title: string,
        error: Errors,
        message: string,
        notify = true,
        log = true
    ) {
        if (log) this.processLog(message);
        console.error(
            `${new Date().toISOString()} : ${title} : ${error} : ${message}`
        );
        if (notify) {
            notifier.notify({
                title,
                message,
            });
        }
        process.exit(1);
    }

    private async processLog(message: string) {
        const time = new Date().toISOString();
        handle(
            () =>
                fs.promises.appendFile(
                    this.processLogPath,
                    `${time} : ${this.id} : ${this.config.bucket} : ${message}\n`
                ),
            (e) => {
                this.processError(
                    Errors.LOG_WRITE,
                    Errors.LOG_WRITE,
                    `failed to write to log: ${e.message}`,
                    true,
                    false
                );
                return e;
            }
        );
    }

    private async fileLog(file: FileMeta, op: Operation, result: string) {
        const time = new Date().toISOString();
        const line = `${time} : ${this.id} : ${this.config.bucket} : ${file.hash} : ${op} : ${file.size} : ${file.path} : ${result}\n`;
        handle(
            () => fs.promises.appendFile(this.filesLogPath, line),
            (e) => {
                this.processLog(`${Errors.LOG_WRITE}: ${e.message}`);
                return e;
            }
        );
    }
}
