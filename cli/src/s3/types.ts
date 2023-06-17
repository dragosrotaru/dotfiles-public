import { z } from "zod";
export type Operation = "NOOP" | "REPLACE" | "CREATE";

export type FileMeta = {
    path: string;
    hash: string;
    size: number;
    lastModified: string;
};

export const InventorySchema = z.record(
    z.object({
        path: z.string(),
        hash: z.string(),
        size: z.number(),
        lastModified: z.string(),
    })
);
export type Inventory = z.infer<typeof InventorySchema>;

export enum Procedures {
    INITIALIZE = "initialize S3Backup",
    BACKUP = "run S3Backup",
}

export enum Status {
    SAME = "same",
    DIFFERENT = "different",
    NOT_FOUND = "notFound",
}

export enum Errors {
    HASH = "hashError",
    STAT = "statError",
    SERVER_STATUS = "serverStatusError",
    UPLOAD = "uploadError",
    CREATE_EXISTS = "createExistsError",
    CREATE_EXISTS_AND_DIFFERENT = "createExistsAndDifferentError",
    REPLACE_SAME = "replaceSameError",
    REPLACE_NOT_FOUND = "replaceNotFoundError",
    LOG_WRITE = "logWriteError",
    NETOWRK = "networkError",
    TAKE_INVENTORY = "takeInventoryError",
    LOAD_INVENTORY = "loadInventoryError",
    SAVE_INVENTORY = "saveInventoryError",
    PARSE_INVENTORY = "parseInventoryError",
}
