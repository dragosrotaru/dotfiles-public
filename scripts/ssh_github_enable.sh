#!/bin/bash

# $1 - github username

SSH_DIR="$HOME/.ssh";

echo "enabling ssh for GitHub"
cat "$(dirname "$0")"/ssh_github_config >> "$SSH_DIR/config";
sed -i -e "s/GITHUB_USERNAME/$1/g" "$SSH_DIR/config";

echo "make sure $SSH_DIR/github.pub is added to your github account";