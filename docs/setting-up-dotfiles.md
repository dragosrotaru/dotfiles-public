# Setting up a dotfiles repo

There are a number of things to consider in your dotfiles

## Dotfiles, duh

So you have a bunch of different software, and you arent sure what is configured, how its configured, whether you want to keep the configuration, and how you should do it. Here is my basic approach:

First, make a list of all the software you have in your system. I like to start by hitting `Command + Shift + .` in finder and looking at my home directory dotfiles researching what each one is used for. Then I run commands like `brew bundle dump` and look at all the Brew apps installed, I look at the `Applications` folder, and at `npm -g list` (or whatever other package managers I have installed). Another place is `Library/Application Support`. I make a complete list of all the software I have which has configuration.

Next, decide what you want to keep and how. you may want to use proprietary sync functionality using logins like for example firefox, Spotify or VSCode has. Alternatively you may want to store it in your dotfiles repo, or perhaps a secrets manager instead. Go down the list and make the decision one by one, until you have all of your valuable configurations saved. Be aware that some software makes it harder than others to store your config in your own system. For example, Firefox has no way of easily listing all the firefox extensions installed, and so I opted in to using the built-in sync feature with a login. 

## Secrets, shhh 🤫

Often times we have secrets, like SSH and GPG Keys, API auth tokens, and .env files in our projects. if your projects are all work related, then perhaps your company may have specific policies in place to deal with these secrets. I have a combination of personal, client (from my consulting) and employer secrets, and they need to be managed accordingly. Some, I store in a secrets manager. Others I am ok with losing if my system goes, because I will just rotate the keys (generate new secrets), which will be more secure. Some secrets are a real pain in the ass to regenerate, or impossible, in which case you may want to store them in a ery secure place. Other times, the secrets are low risk, and you may want to store them directly in your private dotfiles repository. This may be fine, as long as you understand the risk that someone wil gain access to your dotfiles repo. So think carefully about it.

I highly recommend creating a .gitignore in your home directory, that contains all the secrets you dont want to accidentally expose. This can include your AWS key, ah SSH key to production servers, or maybe your personal journal. Whatever the case may be, adding it to gitignore is a great way to prevent disaster.

## Setting up Git correctly

Take a look at the `dotfiles_install.sh` script and you will notice that the repository is setup very differently than you might normally setup a git repo. This is for a number of reasons.

first, you want to create a bare repo so that you can set the worktree root as your home directory while conservatively being able to control what goes in the repo. this is so you can capture all configuration files for your user, while minimally interfering with the functionality of your home directory.

Next, you want to ignore the `.cfg` folder, to prevent self reference and allow git to function properly.

We ignore files by default so that only after they are added, does git tell us if there are uncommited changes.

Lastly, we add an alias, `dotfiles` so we can easily work with the repository.

As I mentioned prior it is also highly recommended to setup a `.gitignore` to prevent uploading files/directories you dont want in there.


## Structure

Here is the basic structure of this dotfiles template:

- `.dotfiles` - this folder makes it easier to commmit stuff to dotfiles, if it doesnt need to be in a specific location. you can safely do `dotfiles add .dotfiles/*`. I store cronjobs, notes and scripts there.
- `Library/LaunchAgents` - this is where the `.plist` files go for your cron jobs or background services
- `projects` - this is the folder I use for storing my software projects. this is the root folder for all source code on my machine.

Every other file in my dotfiles repo is stored at whatever default location it is expected by the applications which use it.


