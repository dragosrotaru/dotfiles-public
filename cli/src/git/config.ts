import path from "path";
import { DOTFILES_DIR } from "../dotfiles";

export class GitConfig {
    static defaultConfigPath = path.join(DOTFILES_DIR, "git.json");
    constructor(public rootDir: string) {}
    static loadConfig(configPath = GitConfig.defaultConfigPath): GitConfig {
        throw new Error("Method not implemented.");
    }
}
