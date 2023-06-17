#!/usr/bin/env node

import { program } from "commander";
import { S3BackupManager } from "./s3/manager";

const s3 = new S3BackupManager();

const cli = program
    .name("kowalski")
    .version("0.0.1")
    .description("CLI tool to keep track of machine status");

const s3Command = cli.command("s3");

s3Command
    .command("backup")
    .option(
        "-b, --bucket <name>",
        "Name of the s3 bucket (default: back up all)"
    )
    .description("Backup the root directory to the s3 bucket")
    .action((action, option) => {
        s3.backup(option.bucket);
    });

s3Command
    .command("report")
    .description("Get reports from the s3 backup manager")
    .option("-b, --bucket <name>", "Name of the s3 bucket (default: shows all)")
    .action((action, option) => {
        s3.report(option.bucket);
    });

s3Command
    .command("info")
    .description("Get information from the s3 backup manager")
    .option("-b, --bucket <name>", "Name of the s3 bucket (default: shows all)")
    .action((action, option) => {
        s3.info(option.bucket);
    });

s3Command
    .command("init")
    .description(
        "Initialize the s3 backup manager. Dont run this twice, there are alternative commands to change the config"
    )
    .requiredOption(
        "-r, --root-dir <path>",
        "Path to the root directory to backup"
    )
    .option("-b, --bucket <name>", "Name of the s3 bucket (default: generated)")
    .option(
        "-c, --credentials <path>",
        "Path to the credentials file (default: ~/.aws/credentials)"
    )
    // TODO add multiple path support option
    .option(
        "-e, --exclude <path>",
        "Path to exclude from the backup (default: [])"
    )
    .option("-w, --warnings", "Enable desktop notifications (default: true)")
    .option(
        "-n, --no-enable",
        "Dont enable and start the s3 backup background service (default: false)"
    )
    .option(
        "-r, --retention <strategy>",
        "Retention Strategy to use on s3 bucket: <number>-days, <number>-versions, retain-all, <number>-days+<number>-versions (default: retain-all)"
    )
    .option(
        "-n, --networks <ssid..>",
        "Only backup when connected to these networks (default: all networks)"
    )
    .action((name, options) => {
        s3.initialize(options);
    });

s3Command
    .command("retention")
    .description("Manage the s3 backup retention strategy")
    .requiredOption(
        "-r, --retention <strategy>",
        "Retention Strategy to use on s3 bucket: <number>-days, <number>-versions, retain-all, <number>-days+<number>-versions (default: retain-all)"
    )
    .action((action, option) => {
        s3.setRetentionStrategy(option.retention);
    });

const s3Service = s3Command
    .command("service")
    .description("Manage the s3 backup background service");

// TODO add service methods

program.parse();
