# Benefits of a Dotfiles Repo

A good dotfiles repository provides you with a number of benefits. Here are my favourite things about mine:

## Configuring a new machine in a fraction of the time

Lets say the worst case scenario happens, and my machine is broken. With a dotfiles repository, I know that I can regain all of the configuration that went into my machine, and get back to work in no time at all. because all of the configuration files have been accounted for, and all I need to do is follow the simple recipie to provision a new machine. This also allows me to go deepder into configuring my machine, as I can customize every aspect without losing it in the future.

Of course, you also have to deal with your provisioning steps or config becoming outdated as operating systems get updated, but generally the steps I have laid out are the same, and while I may have to update `how` the step works, generally the `what` stays the same, and I know I didnt forget to setup anything, allowing me to have my machine in almost the exact same state I had it prior. Yes, you can use something like time machine, but I prefer to have a clean install so that my computer doesn't accumulate dependencies from projects Im not working on anymore, and I like to have a more granular data retention strategy which is what my dotfiles allows me to do.

## Having a complete list of installed software

Its also great to have a full list of everything installed on your machine, and being able to clean out software when you dont need it anymore. My dotfiles helps me keep track of what software I have installed, and what needs to be updated. No matter if you use VMs, vitual enviroments or have every software package installed in one environment, dotfiles can help keep track of these packages and update them. I personally prefer to have a single environment, as I have used Parallels with VMs before for each project/client, but I found it extremely cumbersome. Instead, I use Brew and create Brewfiles for every project.

## Having a comprehensive data backup strategy

While a dotfiles repo isnt necessarly related to data backup, For me it is a great starting point to develop a system for monitoring the state of your data redundancy at any point in time. 

My dotfiles provides me with total peace of mind, knowing that every single valuable byte of information on my personal computer is covered by an automated reporting and backup system that will keep my information safe regardless of what life throws at my machine.

For example, I have syncthing setup to sync data between my phone and my macbook, and a cronjob is setup every day to run a backup of that to an S3 bucket. I then have a report visible to me every time I open the command line, telling me when the last backup was made.

Additionally, the report also tells me which of the 30+ repositories I have on my machine have unpushed commits, uncommited changes or unpulled upstream commits. I have a `git fetch` run every 30 minutes which keeps me updated.

Another great feature is that I have every directory monitored to see if I am not covered by a data redundancy policy. For instance, everything stored in `/projects` directory should be inside a git repo, or tracked by my dotfiles repo. if it isn't, my report tells me. This includes secrets, which I can make sure are backed up to my secrets manager.

Likewise, the reporting system tells me how many files are in my downloads folder, and If I have too many I can delete them so I know Im not forgetting anything important.

You may also use cloud storage like google drive, and setup your dotfiles to tell you if files arent synced up.
