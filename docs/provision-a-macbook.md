# Provisioning a new Macbook

These instructions are meant to help you go through the process of provisioning a new macbook with security and useabiltiy in mind. Some of
the choices here may not make sense for you in particular, so please read through it to make sure it is what you want. you can choose to skip or add steps. When running scripts, it is assumed you are in the scripts directory.

## Forking

If possible, I recommend forking this repo and customizing it before running this process. Otherwise, you can do it during step 17.

# 1. Run through Mac setup wizard but dont login to icloud

This is because the first user you create on the machine will be an admin user. instead, you will wait until a secondary unprivilaged daily driver user is configured.

# 2. Download this repository as a zip from Github on Safari

# 3. Update Macbook. Restart may be required.

`softwareupdate --install --all;`

# 4. Install XCode command line tools

`sudo xcode-select --install;`

# 5. Configure security settings

While applying any changes to SoftwareUpdate defaults, set software update to OFF to avoid any conflict with the defaults system cache.

`sudo softwareupdate --schedule OFF;`

Close any open System Preferences panes, to prevent them from overriding
settings we're about to change

`sudo osascript -e 'tell application "System Preferences" to quit';`

Run the script below or pick and choose what to run from it.

`./provision_security.sh <COMPUTER NAME>;`

Turn software updates back on

`sudo softwareupdate --schedule ON;`

# 6. Install Homebrew

Install Homebrew package manager

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)";`

# 7. Install applications

Install applications from Brewfile; use the default one here or make your own

`brew bundle install --file=Brewfile;`

# 8. Update Homebrew

Update, upgrade and clean brew;

`./brew_update.sh;`

# 9. Add newer bash shell and upgrade default Admin shell

`cat "/usr/local/bin/bash" > /etc/shells;`

`chsh -s /usr/local/bin/bash;`

# 10. Configure Admin UI Settings

Change the default ui system preferences for the admin user

`./provision_ui.sh;`

# 11. Turn on Admin Cron Jobs

If you have admin cron jobs, add them now

`launchctl bootstrap gui/"$(id -u)" ~/Library/LaunchAgents;`

# 12. Create Daily Driver User

`sudo sysadminctl -addUser <name> -fullName "<Full Name>" -password <password> -home "/Users/<name>";`

# 13. Move Repository to /Users/Shared

- Move this folder to the /Users/Shared folder so you can access it from both users. then login to the new User account

# 14. Config User UI Settings

Change the default ui system preferences for the daily driver user

`./provision_ui.sh;`

# 15. Upgrade Default Shell for User to newer bash

`chsh -s /usr/local/bin/bash;`

# 16. Configure Git Access

1. run `./ssh_configure_new.sh github`
2. run `./ssh_github_enable.sh USERNAME`
3. add key to github.com

# 17. Setup your dotfile repository for User

if you dont have a dotfiles repository yet,
you can fork this one at this step.

`./install_dotfiles.sh <your_repo_url>;`

# 18. Turn on User Cron Jobs

`launchctl bootstrap gui/"$(id -u)" ~/Library/LaunchAgents;`

# 19. Configure Additional Software

## Security and Privacy

- setup a VPN
- setup a firewall (Lulu, Little Snitch)
- set inactivity logout/sleep settings
- disable location services
- double check settings to make sure they applied to both users

## UI

- turn on dark mode
- turn on night shift
- show battery percentage
- remove siri from touch bar
- limit spotlight search results

## Firefox

- set default web browser to Firefox (System Preferences > General)
- sign in to sync extensions/settings/bookmarks

## VSCode

- sign in to VSCode to sync extensions/settings

## Next Steps

- install other applications

