# macOS dotfiles template

A template, scripts and guides for keeping a Mac's configuration in a version-controlled dotfiles repository, from provisioning a new machine to scheduled backups and updates.

> Archived: no longer maintained. Kept for reference. I've since moved my own setup to a homelab.

## What's a dotfiles repository?

Dotfiles are the configuration files in your home directory, like `.bash_profile` or `.gitconfig`, usually named with a leading `.`. A dotfiles repository keeps them under version control, so a machine's setup can be rebuilt, audited and backed up instead of being configured by hand.

This repo uses the "bare repository" approach. Your home directory is the working tree, and git data lives in `~/.cfg`, managed through a `dotfiles` alias:

```sh
alias dotfiles='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
```

## What's in it

| Folder | Contents |
| --- | --- |
| `template/` | An example home directory: `.bash_profile`, `.gitconfig` (with commit signing), a `Brewfile`, a `projects/` workspace, and launchd agents that run daily backup and update jobs |
| `scripts/` | Shell scripts for provisioning and admin: Homebrew/apt/Nix/Node updates, macOS security and UI defaults, SSH key generation and GitHub SSH config, creating a Linux sudo user |
| `docs/` | Step-by-step guides (see below) |
| `cli/` | `kowalski`, an unfinished TypeScript CLI for S3 backups with retention policies, plus status reports on local git repositories and installed software |

## Guides

- [Why keep dotfiles](docs/dotfiles-benefits.md)
- [Provisioning a new MacBook](docs/provision-a-macbook.md)
- [Setting up your dotfiles repository](docs/setting-up-dotfiles.md)
- [Backups](docs/backups.md) and [S3 backups](docs/s3-backups.md)
- [CLI notes](docs/cli.md)

## Using it

1. Follow [Provisioning a new MacBook](docs/provision-a-macbook.md) on a fresh machine.
2. Copy what you want from `template/` into your home directory, replacing placeholders such as `John Doe`, `john@example.com`, `SIGN_KEY`, `USERNAME` and `GITHUB_USERNAME`.
3. Create your own bare repository as described in [Setting up your dotfiles repository](docs/setting-up-dotfiles.md).

The scripts and launchd agents target Apple Silicon macOS with Homebrew in `/opt/homebrew`, as of 2023.

## Status of the CLI

`kowalski` can initialise, back up to and report on S3 buckets using the AWS SDK. Restore, encryption, dry runs and Linux support were planned but never built. See [docs/index.md](docs/index.md) for the full list.

## License

MIT. See [LICENSE](LICENSE).
