#!/bin/bash

# sudo softwareupdate --list; # List available packages
# sudo softwareupdate --download; # Download only
softwareupdate --background --install --all; # --recommended OR --os-only AND --restart