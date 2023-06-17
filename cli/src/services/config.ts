export class ServiceConfig {
    public NAMESPACE = "dotfiles";
    constructor(
        public interval: string,
        public service: string,
        public name: string,
        public stdout: string,
        public stderr: string
    ) {}
}
