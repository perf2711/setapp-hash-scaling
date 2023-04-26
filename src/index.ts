import { watchJobs } from './jobManager';

interface RunningJob {
    readonly job: string;
    readonly abort: AbortController;
    runs: number;
}

const runningJobs = new Map<string, RunningJob>();

function delay(time: number, abort: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            abort.removeEventListener('abort', cancel);
            resolve();
        }, time);

        function cancel() {
            clearTimeout(timeout);
            reject(new Error('Operation cancelled.'));
        }

        abort.addEventListener('abort', cancel);
    });
}

async function startJob(job: string) {
    const abort = new AbortController();

    console.log(`starting job ${job}`);
    const runningJob: RunningJob = { job, abort, runs: 0 };
    runningJobs.set(job, runningJob);

    try {
        while (!abort.signal.aborted) {
            // console.log(`processing job ${job}`);
            await delay(1000 + Math.random() * 5000, abort.signal);
            // console.log(`processed job ${job}`);
            runningJob.runs++;
            await delay(1000 + Math.random() * 5000, abort.signal);
        }
    } catch (err) {
        console.log(`job ${job} cancelled because of: ${err}`);
    }
}

async function cancelJob(job: string) {
    const runningJob = runningJobs.get(job);
    if (!runningJob) {
        return;
    }

    console.log(`cancelling job ${job}`);
    runningJob.abort.abort();
    runningJobs.delete(job);
}

function printStats() {
    console.log('[ ==== Stats ====');
    for (const [, { job, runs }] of runningJobs) {
        console.log(`[ ${job}: ${runs} runs`);
    }
    console.log(`[ ${runningJobs.size} jobs currently running`);
}

const workerIds = process.argv.slice(2);
(async () => {
    (await watchJobs(workerIds)).on('job-added', (job) => startJob(job)).on('job-removed', (job) => cancelJob(job));
})();

setInterval(printStats, 5000);
