import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { ReportingManager } from "../report/manager";
import { Service } from "../services/service";
import { FSError, ParseError, save } from "../util/fs";
import {
    DEFAULT_S3_DIR,
    S3BackupConfig,
    S3BackupConfigSchema,
    filepaths,
} from "./config";
import { S3Backup } from "./repository";

type RetentionStrategy =
    | "retail-all"
    | { days: number }
    | { versions: number }
    | { days: number; versions: number };

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type Options = PartialBy<S3BackupConfig, "bucket"> & {
    noEnable?: boolean;
    retention?: string;
};

export class S3BackupManager {
    /* API Methods */
    public async info(bucket?: string) {
        // include config
        // include status
        // include inventory
        // include exclude paths
        return new Error("Method not implemented.");
    }

    public async backup(bucket?: string) {
        return new Error("Method not implemented.");
    }

    public async report(bucket?: string) {
        return new Error("Method not implemented.");
    }

    public async initialize({
        rootDir,
        bucket,
        credentials,
        exclude,
        warnings,
        noEnable,
        retention,
    }: Options) {
        // Parse Retention Strategy
        const retentionStrategy = await this.parseRetentionStrategy(retention);
        if (retentionStrategy instanceof Error) {
            console.error(retentionStrategy);
            process.exit(1);
        }

        // Parse Bucket Name
        const rootDirName = path.basename(rootDir);
        const bucketID =
            bucket ?? "kowalski-" + rootDirName + randomUUID().slice(0, 8);

        // Validate rootDir
        try {
            fs.existsSync(rootDir);
        } catch (error) {
            console.error("rootDir does not exist: " + rootDir);
        }
        try {
            fs.accessSync(rootDir, fs.constants.R_OK);
        } catch (error) {
            console.error("need permissions to read rootDir: " + rootDir);
            process.exit(1);
        }

        // Validate excludeGlobs are not outside of rootDir
        if (exclude) {
            for (const glob of exclude) {
                // TODO: validate exclude path is not an absolute path or relative path outside of rootDir
            }
        }

        // Initialize meta files
        const DIR = filepaths({ rootDir, bucket: bucketID }).dir;
        const config = await this.initializeFiles({
            rootDir,
            bucket: bucketID,
            credentials,
            exclude,
            warnings,
        });
        if (config instanceof Error) {
            this.cleanupFiles(DIR);
            console.error(config);
            process.exit(1);
        }

        // Initialize Service
        const servicePath = path.join(
            "~/Library/LaunchAgents",
            `kowalski.${bucket}-s3backup.plist`
        );
        const service = await this.initializeService(servicePath, noEnable);
        if (service instanceof Error) {
            this.cleanupFiles(DIR);
            this.cleanupService(servicePath);
            console.error(service);
            process.exit(1);
        }

        // Initialize and Validate S3 Credentials, Bucket, and Permissions
        const initializedS3 = await this.initializeS3(
            bucketID,
            retentionStrategy,
            credentials
        );
        if (initializedS3 instanceof Error) {
            this.cleanupFiles(DIR);
            this.cleanupService(servicePath);
            this.cleanupS3(bucketID, retentionStrategy, credentials);
            console.error(initializedS3);
            process.exit(1);
        }

        const s3Backup = new S3Backup(config);

        await s3Backup.initialize();

        if (warnings) {
            // TODO add warning manager
            const reportManger = new ReportingManager();
            reportManger.enableNotification();
        }

        if (!noEnable) {
            service.enable();
            service.start();
            console.log("S3 Backup service started");
        }

        console.log("S3 Backup initialized successfully");
        console.log(this.info());
    }
    public async uninstall() {
        return new Error("Method not implemented.");
    }

    /* File Methods */

    private async initializeFiles(configData: S3BackupConfig) {
        const { dir, config, inventory, processLog, filesLog, report } =
            filepaths(configData);
        if (fs.existsSync(dir)) {
            return new FSError(
                "folder with bucket id already exists, please delete it or check your config"
            );
        }

        if (!fs.existsSync(DEFAULT_S3_DIR)) {
            try {
                fs.mkdirSync(DEFAULT_S3_DIR, { recursive: true });
            } catch (error) {
                console.error(error);
                return new FSError(
                    "failed to create folder: " + DEFAULT_S3_DIR
                );
            }
        }

        try {
            fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
            return new FSError("need permissions to create folder: " + dir);
        }

        // Create the bucket folder
        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
            console.error(error);
            return new FSError("failed to create folder: " + dir);
        }

        const configObj = S3BackupConfigSchema.parse(configData);
        const saved = await save(config, configObj);
        if (saved instanceof Error) {
            // Delete the folder
            fs.rmdirSync(dir, { recursive: true });
            return saved;
        }

        try {
            fs.writeFileSync(inventory, "{}");
            fs.writeFileSync(processLog, "");
            fs.writeFileSync(filesLog, "");
            fs.writeFileSync(report, "");
        } catch (error) {
            return new FSError(
                "failed to create files in " + dir + " : " + error
            );
        }

        return configObj;
    }
    private async cleanupFiles(DIR: string) {
        fs.rmdirSync(DIR, { recursive: true });
    }

    /* Service Methods */

    private async initializeService(
        path: string,
        noEnable?: boolean
    ): Promise<Service | Error> {
        return new Error("Method not implemented.");
    }
    private async cleanupService(path: string) {
        return new Error("Method not implemented.");
    }

    /* S3 Methods */

    private async initializeS3(
        bucket: string,
        retention: RetentionStrategy,
        credentials?: string
    ) {
        const needsLifeCyclePermissions = retention !== "retail-all";
        if (credentials) {
            process.env["AWS_PROFILE"] = credentials;
        }
        try {
            // validate credentials
            // validate bucket permissions
            // validate bucket lifecycle permissions
            // create bucket
            // create bucket lifecycle
            return new Error("Method not implemented.");
        } catch (error) {
            // return useful error
            return new Error("AWS credentials validation failed " + path);
        }
    }
    private async cleanupS3(
        bucket: string,
        retention: RetentionStrategy,
        credentials?: string
    ) {
        if (credentials) {
            process.env["AWS_PROFILE"] = credentials;
        }
        return new Error("Method not implemented.");
    }

    public async setRetentionStrategy(strategy: RetentionStrategy) {
        return new Error("Method not implemented.");
    }
    private async getRetentionStrategy() {
        return new Error("Method not implemented.");
    }

    private async uninstallDeleteStrategy() {
        return new Error("Method not implemented.");
    }

    private async parseRetentionStrategy(
        strategy?: string
    ): Promise<RetentionStrategy | ParseError> {
        if (!strategy) {
            return "retail-all";
        }
        if (strategy === "retail-all") {
            return "retail-all";
        }
        if (strategy.includes("+")) {
            const [dayCutoff, versionCutoff] = strategy.split("+");
            if (!dayCutoff || !versionCutoff) {
                return new ParseError("invalid retention strategy");
            }
            const dayCutoffNumber = parseInt(dayCutoff);
            const versionCutoffNumber = parseInt(versionCutoff);
            if (isNaN(dayCutoffNumber) || isNaN(versionCutoffNumber)) {
                return new ParseError("invalid retention strategy");
            }
            return { days: dayCutoffNumber, versions: versionCutoffNumber };
        }
        if (strategy.endsWith("-days")) {
            const dayCutoff = strategy.split("-days")[0];
            if (!dayCutoff) {
                return new ParseError("invalid retention strategy");
            }
            const dayCutoffNumber = parseInt(dayCutoff);
            if (isNaN(dayCutoffNumber)) {
                return new ParseError("invalid retention strategy");
            }
            return { days: dayCutoffNumber };
        }
        if (strategy.endsWith("-versions")) {
            const versionCutoff = strategy.split("-versions")[0];
            if (!versionCutoff) {
                return new ParseError("invalid retention strategy");
            }
            const versionCutoffNumber = parseInt(versionCutoff);
            if (isNaN(versionCutoffNumber)) {
                return new ParseError("invalid retention strategy");
            }
            return { versions: versionCutoffNumber };
        }
        return new ParseError("invalid retention strategy");
    }
}
