#! /bin/bash

# $1 - dotfiles repo url

# Download the dotfiles repo

git clone --bare "$1" "$HOME/.cfg";

git --git-dir="$HOME/.cfg/" --work-tree="$HOME" checkout;

echo ".cfg" >> .gitignore;

# shellcheck disable=SC1091
source .bash_profile;

dotfiles config --local status.showUntrackedFiles no;