# Backups

Here are some questions you should ask yourself about all the valuable data you have on your devices:

- Does it need to be versioned?
- Does it need semantically meaningful versioning (branching, tags)?
- What retention policy does it need?
- How much redundancy does it need?
- Where and when does it need to be available?
- Who can and needs to access it, and in what way (how, when, from where)?
- Should it be encrypted?

Once you go through your data answering these questions, you can develop
a kick ass data backup and loss prevention strategy for yourself, family or business.

There are many technologies out there to do backups, versioning, syncing, and so on, I have included a list of them at the bottom. There is never a one size fits all approach to selecting a tool to provide the data security you need, from data to data and especially from person to person.

## Thinking about Data

I like to partition the problem by thinking of different buckets we can sort my data by.
One useful one is the location of data:

1. on my personal hardware device
2. on my friends/family member's device
3. on my server or self-hosted system
4. on a third party system

Data on my personal device is my favourite because I am fairly certain nobody will (legally) meddle with it. I like to back it up to a server in case my device is lost of stolen. Whereas I have little trust in third party systems like facebook, notion or my task tracker, but the convenience of some of these platforms is more important to me. Nonetheless, I can still export my data every once in a while and maintain some level of control.

Another useful way to categorize data is by its use case:

1. secrets - passwords, credentials, payment methods
2. documents - contracts, speadsheets, notes
3. code/config - software I write or configure
4. content - books, movies, music, podcasts, articles, photos

I know that, for instance, code/config needs really good, semantic versioning (git) and I always access it on my laptop, very rarely on my phone. Whereas content seldom needs versioning, but I access it frequently from both devices, and having it cached on both is super important when my connectivity is inconsistent. Documents need versioning that doesn't get in the way, and ideally is offline first, for example using CRDTs (Anytype notes app) or operational transforms (Google Docs, not offline capable). Secrets need to be kept secret, so the access needs to be highly restricted, but I also need to be able to quickly gain access to these secrets so that my day to day life doesn't become difficult.

Understanding the patterns of use for your data will help you make the best decisions possible with regards to how you design your personal systems.

## Test your recovery

If you've never tested your data recovery from backups, how do you know they work? its important to actually test out all the recovery scenarios and consider different possibilities. For example, in the case you are travelling, have 2 factor authentication enabled, and have both your phone and laptop stolen, how do you regain access? what if you pass away, how will your family/coworkers know to gain access to the credentials they need to deal with the administrative issues ahead?

## Protocols, Standards and Languages

There are many useful standards for the manipulation, sharing and storage of data,
below are some that are important to know. Some are old school, some ubiquitous, and some are brand new. I find it necessary to have a combination of these

- FUSE/Posix File System - the Operating Systems File System interface
- SQL - Database Query Language
- FTP/SFTP - (Secure) File Transfer Protocol
- NFS/SMB/NCP/CIFS - Various Network File System Protocols
- Git - Version Control System
- Syncthing - Peer to Peer Syncing Protocol
- LibP2P - Library for various Peer to Peer Protocols
- Torrent - Peer to Peer File Sharing
- IPFS - Content Addressable Storage Protocol
- DHT - Distributed Hash Table
- CRDT - Conflict Free Replicated Datatypes

## Some other useful tools

- AWS S3 - cloud filestore
- Solid Explorer - freemium android app for exploring files, has FTP server support
- OpenWRT - open source router OS, good for lightweight storage server

## Useful References

https://sea-of-stuff.github.io/comparison.htm
https://www.filestash.app/
https://www.borgbackup.org/
https://docs.ipfs.tech/
https://github.com/dmfutcher/git-s3-push
https://github.com/minio/mc
https://github.com/s3fs-fuse/s3fs-fuse
https://github.com/schickling/git-s3
https://www.reddit.com/r/selfhosted/comments/12237fh/picking_a_centralised_backup_solution/
