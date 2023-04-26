import { createHash } from 'node:crypto';

/**
 * Check whether this job is assigned to provided worker.
 */
export function isMyJob(workers: Iterable<string>, workerIds: string[], job: string) {
    const hashes = [...workers]
        .map((w) => [w, createHash('sha1').update(w).update(job).digest('hex')] as const) // Create hash of worker ID and job ID
        .sort(([, h1], [, h2]) => h1.localeCompare(h2)); // Sort by hashes alphabetically

    return hashes[0] && workerIds.includes(hashes[0][0]);
}
