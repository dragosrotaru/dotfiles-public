# Macbook Dotfiles Template

This repository contains scripts and configuration files to help you get started with making your own dotfiles repository for MacOS systems.

## What is a dotfiles repository

dotfiles are all the files on your computer that are responsible for configuring the various software you use everyday. traditionally, they start with a `.` in you your home directory. For example, `.bash_profile` is a dotfiles which changes how your command line shell works when you login.

A Dotfiles Repository is a version controlled repository which helps you maintain and keep track of all of that important configuration data on your machine, which you have spent so much time customizing. It is also a way to systematize the maintenance, administration and backup of your device.

## Who is this repo for

This repository is for anyone interested in creating their own dotfiles repository. it provides you with a number of useful features:

- a step by step guide with scripts for provisioning a fresh new macbook.

- various utility scripts which you might find useful to perform admin tasks

- example files and a structure to show you how to create your own dotfiles configuration

- a status monitoring library written in TypeScript, to help you monitor the status of all your local repositories, untracked files and software updates.

- recurring background tasks to keep your data backed up, and your software up-to-date.

## Structure

there are 3 folders in this repository:

- `template`: the dotfiles example template for you to work off of. this would be your home directory
- `scripts`: scripts which come in handy when provisioning or administering your machine. you can choose to copy scripts over into your own dotfiles if you wish.
- `docs`: step by step instructions, and supporting documentation to help you understand how it works and why its done in a certain way

## Publish Workflow

- bump versions in package.json and in cli.ts
- add to CHANGELOG
- push to master
- create a tag and release in github
- the publish workflow will then publish to npm

## Contributing

Contributions are welcome! Please feel free to submit a PR or message me if you need help

## License

This project is licensed under the MIT License. See LICENSE file.
