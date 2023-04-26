import { createHash } from 'node:crypto';

/**
 * Check whether this job is assigned to provided worker.
 */
export function isMyJob(workers: Iterable<string>, workerIds: string[], job: string) {
    const workerHashes = [...workers]
        .map((w) => [w, createHash('sha1').update(w).digest('hex')] as const) // Create hash of worker IDs
        .sort(([, h1], [, h2]) => h2.localeCompare(h1)); // Sort by hashes alphabetically descending

    const jobHash = createHash('sha1').update(job).digest('hex');

    // Find the first worker hash that is alphabetically before job hash
    // W > j
    // P > j
    // K > j
    // B < j - this is the "winner"
    // A
    for (const [worker, hash] of workerHashes) {
        if (jobHash.localeCompare(hash) >= 0) {
            return workerIds.includes(worker);
        }
    }

    // Wrap around if none match
    return workerIds.includes(workerHashes[0]?.[0]);
}
