import { createHash } from 'node:crypto';

/**
 * Check whether this job is assigned to provided worker.
 */
export function isMyJob(workers: Iterable<string>, workerIds: string[], job: string) {
    const workerArray = [...workers];

    const jobHash = createHash('sha1').update(job).digest();
    const index = jobHash.readUInt32LE() % workerArray.length;

    return workerIds.includes(workerArray[index]);
}
