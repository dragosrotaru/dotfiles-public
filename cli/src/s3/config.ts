import path from "path";
import { z } from "zod";

export const S3BackupConfigSchema = z.object({
    rootDir: z.string(),
    bucket: z.string(),
    credentials: z.string().optional(),
    exclude: z.array(z.string()).optional(),
    warnings: z.boolean().optional(),
    networks: z.array(z.string()).optional(),
});
export type S3BackupConfig = z.infer<typeof S3BackupConfigSchema>;

export const DEFAULT_S3_DIR = "~/.kowalski/s3";
export const DEFAULT_AWS_CREDENTIALS = "default";

export const filepaths = (config: S3BackupConfig) => {
    const dir = path.join(DEFAULT_S3_DIR, config.bucket);
    return {
        dir,
        inventory: path.join(dir, "inventory.json"),
        config: path.join(dir, "config.json"),
        filesLog: path.join(dir, "files.log"),
        processLog: path.join(dir, "process.log"),
        report: path.join(dir, "report.json"),
    };
};
