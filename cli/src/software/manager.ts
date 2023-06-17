export class SoftwareManager {
    updateAll = async () => {
        throw new Error("Not implemented");
    };

    // check for global packages not maintained by one of the supported package managers
    // For example, apps in /Applications and binaries in /usr/local/bin
    checkForUnmanagedSoftware = async () => {
        throw new Error("Not implemented");
    };

    checkForMacOSUpdates = async () => {
        throw new Error("Not implemented");
    };
    updateMacOS = async () => {
        throw new Error("Not implemented");
    };

    initialize() {
        throw new Error("Method not implemented.");
    }

    installService() {
        throw new Error("Method not implemented.");
    }
    getServiceStatus() {
        throw new Error("Method not implemented.");
    }
    uninstallService() {
        throw new Error("Method not implemented.");
    }
    setServiceInterval() {
        throw new Error("Method not implemented.");
    }

    getStats = async () => {
        throw new Error("Not implemented");
    };

    printFilePaths() {
        throw new Error("Method not implemented.");
    }

    enableTrayIcon() {
        throw new Error("Method not implemented.");
    }
    disableTrayIcon() {
        throw new Error("Method not implemented.");
    }
    enableWarnings() {
        throw new Error("Method not implemented.");
    }
}
