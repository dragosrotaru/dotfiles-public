#!/bin/bash
# $1 - username

echo "creating user with sudoer permission and bash shell";
sudo useradd -d "/home/$1" -m -G sudo "$1" -s "/bin/bash";

echo "enter user password:";
sudo passwd "$1";