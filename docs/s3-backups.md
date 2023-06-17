# Using Amazon Web Services S3 Buckets for backup

## Checksums

The sdk automatically adds a SHA256 hash in the etag metadata on upload
For every file, we can check the metadata to see if latest version hash is the same or not,
and upload accordingly

## Versioning

(DELETE) `Expiration` action applies to current version, marked as delete
(DELETE Object versionId) `NoncurrentVersionExpiration` action applies to non current versions, permanently deletes version
Overwriting creates new object version
Versions are charged as normal objects
ListObjectVersions to get all the versions in a bucket
HEAD Object versionId to get the metadata for a specific object
Restoring previous versions works by copying a previous version into the same bucket, it is treated as a new version with new versionid
To restore the last version you delete the delete market with DeleteObject versionId

you can use AWS backups with S3 if versioning is enabled

## Archive

-   Standard 0.023gb/mo (Frequent Access)
-   Infrequent Access 0.0125gb/mo (Infrequent Access)
-   Glacier Instant Retrieval 0.004gb/mo (Archive Instant Access)
-   Glacier Deep Archive 0.00099/gb/mo (Deep Archive Access) 12hrs

Use S3 Intelligent Tiering to automatically move data to the lower cost tiers

Actions that prevents moving down to lower tier, and moves back to frequent tier:

    CopyObject, UploadPartCopy, GetObject, PutObject, RestoreObject, CompleteMultipartUpload, ListParts
    S3 console download, copy
    replicating objects with S3 Batch Replication

Actions that you can do no problem: HeadObject, GetObjectTagging, PutObjectTagging, ListObjects, ListObjectsV2, or ListObjectVersions.

## Using Intelligent Tiering

- PUT x-amz-storage-class INTELLIGENT_TIERING

-   Or setup Lifecycle configuration to tell Amazon S3 to transition objects from one storage class to another (existing objects)

## Amazon S3 Inventory
