import { execAsync } from "../util/exec";
import { SoftwareConfig } from "./config";

export class Brew {
    constructor(config: SoftwareConfig) {}
    listOutdatedPackages = async () => {
        return (await execAsync("brew outdated -q")).stdout.trim().split("\n");
    };
    listPackagesNotInBrewfile = async () => {
        throw new Error("Not implemented");
    };
    listPackagesNotInstalledFromBrewfile = async () => {
        throw new Error("Not implemented");
    };
    updateAll = async () => {
        throw new Error("Not implemented");
    };
    installBrew = async () => {
        throw new Error("Not implemented");
    };
    updateBrewfile = async () => {
        throw new Error("Not implemented");
    };
    addMissingPackagesToBrewfile = async () => {
        throw new Error("Not implemented");
    };
    removePackagesNotInBrewfile = async () => {
        throw new Error("Not implemented");
    };
}
