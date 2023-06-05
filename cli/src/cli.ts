#!/usr/bin/env node

import { program } from "commander";
import { exit } from "process";
import {
    fetchAllRepos,
    getAllNotInRepo,
    getAllTrackedFiles,
    getAllUncommittedFilesPerRepo,
    getAllUnpushedCommitsPerBranch,
    isIgnored,
} from "./git";

program
    .name("kowalski")
    .version("0.0.1")
    .description("CLI tool to keep track of machine status")
    .parse();

const options = program.opts();

const config = {
    repositoriesPath: "",
    dotfilesPath: "",
};

// TODO write a command to install an analysis generation cron job
// TODO write a command to install a bash_profile report
// TODO write a command to init a config file
// TODO write a bash script to run updates
// TODO write a function to process a config file and check the status of the machine based on the config file

export const analysis = async (directoryPath: string) => {
    await fetchAllRepos(directoryPath);
    const unpushed = await getAllUnpushedCommitsPerBranch(directoryPath);
    const uncommited = await getAllUncommittedFilesPerRepo(directoryPath);

    const trackedInDotfiles = await getAllTrackedFiles("dotfilesPath");
    const untracked = (await getAllNotInRepo(directoryPath)).filter(
        async (file) =>
            !(await isIgnored(file)) && !trackedInDotfiles.includes(file)
    );
    return { unpushed, uncommited, untracked };
};

exit(0);
