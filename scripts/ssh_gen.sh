#!/bin/bash
# $1 - filename

ssh-keygen -t ed25519 -a 100 -f "$1" -N '' -C '';