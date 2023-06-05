#!/bin/bash

sudo nix-channel --update;
sudo nixos-rebuild switch;