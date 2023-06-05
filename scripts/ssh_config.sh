#!/bin/bash

# $1 - filename

SSH_DIR="$HOME/.ssh";

echo "creating .ssh directory";
mkdir "$SSH_DIR";

echo "generating an SSH key";
"$(dirname "$0")"/ssh_gen.sh "$SSH_DIR/$1";

echo "adding key to users authorized_keys";
cat "$SSH_DIR/$1.pub" > "$SSH_DIR/authorized_keys";

chmod -R 0600 "$SSH_DIR";