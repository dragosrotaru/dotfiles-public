import { SoftwareConfig } from "./config";

export class PNPM {
    constructor(config: SoftwareConfig) {}
    listOutdatedPackages = async () => {
        throw new Error("Not implemented");
    };
    listPackagesNotInPackageJSON = async () => {
        throw new Error("Not implemented");
    };
    listPackagesNotInstalledFromPackageJSON = async () => {
        throw new Error("Not implemented");
    };
    updateAll = async () => {
        throw new Error("Not implemented");
    };
    installPNPM = async () => {
        throw new Error("Not implemented");
    };
    updatePackageJSON = async () => {
        throw new Error("Not implemented");
    };
    addMissingPackagesToPackageJSON = async () => {
        throw new Error("Not implemented");
    };
    removePackagesNotInPackageJSON = async () => {
        throw new Error("Not implemented");
    };
    reinstallPackagesInstalledWithNPM = async () => {};
}
