// TODO implement statistics reporting
// TODO implement retention strategy
// TODO implement empty functions
// TODO implement logging
// TODO tests
// TODO implement bucket name, namespacing, bucket config
// TODO encryption
// TODO deal with large files

/* 
    Retention Strategies:

    - we can keep versioned indexes of the files in the bucket,
    and only delete files that are not in any of the indexes.

    - we can keep one index with versioned metadata for each file,
    so we can keep track of the history of each file independently. 
    
    Policies can include:

    - latest
    - last X versions
    - exponential/fibbonaci/prime - 1, 2, 4, 8, 16, 32, 64
    - latest index, newest index older than 1 day /week / month / year
    - ???

*/

type MetaData = { hash: string; time: string };

/**
 * reads the file and returns its hash
 * @param filePath
 */
const getHash = async (filePath: string): Promise<string> => {};

/**
 * Accepts a directory and returns a list of all filePaths in the directory relative to
 * the directory path, not including directories
 * @param directoryPath
 */
const getAllFilePaths = async (directoryPath: string): Promise<string[]> => {};

/**
 * returns a metadata file index from s3
 * @param bucket
 */
const getS3FileIndex = async (): Promise<Record<string, MetaData>> => {};

const updateS3FileIndex = async (index: Record<string, MetaData>) => {};

/**
 * Doesnt upload if the file already exists
 * Checks the file against the hash to see if any changes have been made
 * since the hash was computed. If so, it throws an error
 * This makes the procedure idempotent
 * @param filePath
 * @param hash
 */
const uploadFileToS3 = async (filePath: string, hash: string) => {
    if (hash !== (await getHash(filePath))) {
        throw new Error("File has changed since hash was computed");
    }
};

/**
 * If the file still exists, the function checks the file against the hash provided
 * to see if it it matches. if it does, the function throws an error.
 * @param filePath
 * @param hash
 */
const removeFileFromS3 = async (filePath: string | null, hash: string) => {
    if (filePath && hash === (await getHash(filePath))) {
        throw new Error("File has returned since hash was computed");
    }
};

const listS3Files = async (): Promise<string[]> => {};

const downloadFileFromS3 = async (destinationPath: string, hash: string) => {};

const setFileTime = async (filePath: string, time: string) => {};

/**
 *
 * @param directoryPath
 */
const backupToS3 = async (directoryPath: string) => {
    const time = new Date().toISOString();

    const paths = await getAllFilePaths(directoryPath);
    const files: [string, string][] = await Promise.all(
        paths.map(async (path) => [path, await getHash(path)])
    );

    // get the file index from s3
    const fileIndex = await getS3FileIndex();
    const newIndex: Record<string, MetaData> = {};

    const add: [string, string][] = [];
    const change: [string, string, string][] = [];
    const remove: [string, string][] = [];

    for (const [path, hash] of files) {
        const meta = fileIndex[path];
        if (!meta) {
            add.push([path, hash]);
            newIndex[path] = { hash, time };
            continue;
        }
        if (meta.hash !== hash) {
            change.push([path, hash, meta.hash]);
            newIndex[path] = { hash, time };
            continue;
        }
        newIndex[path] = { ...meta, time };
    }

    for (const path in fileIndex) {
        if (!paths.includes(path)) {
            const file = fileIndex[path] as MetaData;
            remove.push([path, file.hash]);
        }
    }

    /*
        Important in order to prevent removing files that are duplicated.
        For example you copy+paste a file, or you rename one of the copies.
        Without filtering the remove operations this would result in the file
        being removed from the backup.
    */

    const newHashes = [
        ...add.map(([_, hash]) => hash),
        ...change.map(([_, hash]) => hash),
    ];
    const filteredRemove = remove.filter(
        ([_, hash]) => !newHashes.includes(hash)
    );
    const filteredChange = change.filter(
        ([_, __, oldHash]) => !newHashes.includes(oldHash)
    );

    /* 
        If the software crashes up to this point there is no risk.
        If the directory state changes, then the upload and remove
        operations will throw errors, which will case various edge
        cases. The worst case is that the backup will be out of sync
        for a while, but it will eventually catch up with enough
        attempts. We can execute backups much more frequently as 
        the cost of failure is low and the operations are idempotent,
        so we can just retry until it works.
    */

    // Upload added files
    await Promise.all(add.map(([path, hash]) => uploadFileToS3(path, hash)));

    /*
        if the software crashes here, there will be orphan files in the backup
        which will be removed on the next run. This is not a problem.
    */

    // Upload changed files
    await Promise.all(change.map(([path, hash]) => uploadFileToS3(path, hash)));

    /* 
        if the software crashes here, there will be orphan files in the backup
        which will be removed on the next run. This is not a problem.
    
    */

    // Replace index
    await updateS3FileIndex(newIndex);

    /* 
        if the software crashes here, then the index will be out of sync with
        the files in the backup. This is not a problem, as the existing index
        is still going to be valid as no files have been deleted, and
        the progress already made in uploading files is preserved.
    
    */

    // Remove removed files
    await Promise.all(
        filteredRemove.map(([path, hash]) => removeFileFromS3(path, hash))
    );

    /* 
        if the software crashes here, then there will be orphan files in the
        backup which will be removed on the next run. This is not a problem.
    */

    // Remove changed files
    await Promise.all(
        filteredChange.map(([path, __, oldHash]) =>
            removeFileFromS3(path, oldHash)
        )
    );

    /* 
        if the software crashes here, then there will be orphan files in the
        backup which will be removed on the next run. This is not a problem.
    */
};

const restoreFromS3 = async (directoryPath: string) => {
    const index = await getS3FileIndex();
    const files = Object.entries(index);
    await Promise.all(
        files.map(async ([path, meta]) => {
            // TODO set directory root
            await downloadFileFromS3(path, meta.hash);
            await setFileTime(path, meta.time);
        })
    );
};

export const cleanUpS3 = async (directoryPath: string) => {
    const index = await getS3FileIndex();
    const hashes = Object.values(index).map((meta) => meta.hash);
    const fileList = await listS3Files();
    const filesToRemove = fileList.filter((file) => !hashes.includes(file));
    Promise.all(filesToRemove.map((file) => removeFileFromS3(null, file)));
};
