#!/bin/bash

eval "$(/opt/homebrew/bin/brew shellenv)"

# Supress MacOS Warning
export BASH_SILENCE_DEPRECATION_WARNING=1;

# Set Default Editor

if command -v code &> /dev/null
then
    EDITOR='code';
elif command -v nano &> /dev/null
then
    EDITOR='nano';
else
    EDITOR='vi';
fi

export EDITOR;

# Colors
export force_color_prompt=yes;

# Dotfiles Alias
alias dotfiles='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME';
