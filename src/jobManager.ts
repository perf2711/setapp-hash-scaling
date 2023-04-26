import chokidar from 'chokidar';
import { lock } from 'cross-process-lock';
import EventEmitter from 'node:events';
import fs from 'node:fs/promises';
import TypedEmitter from 'typed-emitter';

// import { isMyJob } from './distributedHashing';
// import { isMyJob } from './consistentHashing';
import { isMyJob } from './rendezvousHashing';

const myJobs = new Set<string>();
const workers = new Set<string>();

const jobFilePath = './jobs.json';
const workersFilePath = './workers.json';

type Events = {
    'job-added'(job: string): void;
    'job-removed'(job: string): void;
};

const eventBus = new EventEmitter() as TypedEmitter<Events>;

function isWorkerAlive(timestamp: number) {
    return timestamp > Date.now() - 10000;
}

async function readJobs(path: string): Promise<Set<string>> {
    return new Set<string>(JSON.parse(await fs.readFile(path, 'utf-8')));
}

async function readWorkers(path: string): Promise<Map<string, number>> {
    const unlock = await lock(path);
    try {
        const workers = JSON.parse(await fs.readFile(path, 'utf-8')) as Record<string, number>;
        return new Map(Object.entries(workers));
    } finally {
        await unlock();
    }
}

async function writeWorkers(path: string, workers: Map<string, number>) {
    await fs.writeFile(path, JSON.stringify(Object.fromEntries(workers)), 'utf-8');
}

async function writeMyWorkers(path: string, workerIds: string[]) {
    const unlock = await lock(path);
    try {
        const workers = await readWorkers(path);
        for (const workerId of workerIds) {
            workers.set(workerId, Date.now());
        }
        await writeWorkers(path, workers);
    } finally {
        await unlock();
    }
}

async function refreshJobs(workerIds: string[], path: string) {
    console.log('refreshing jobs');

    const newJobList = await readJobs(path);

    for (const job of myJobs) {
        if (!isMyJob(workers, workerIds, job) || !newJobList.has(job)) {
            myJobs.delete(job);
            eventBus.emit('job-removed', job);
        }
    }

    for (const job of newJobList) {
        if (isMyJob(workers, workerIds, job) && !myJobs.has(job)) {
            myJobs.add(job);
            eventBus.emit('job-added', job);
        }
    }
}

async function refreshWorkers(workerIds: string[], path: string) {
    const newWorkerList = await readWorkers(path);

    const oldWorkers = [...workers.keys()];
    const newWorkers = [...newWorkerList].filter(([, t]) => isWorkerAlive(t)).map(([w]) => w);

    let dirty = false;
    if (oldWorkers.length !== newWorkers.length) {
        dirty = true;
    } else if (newWorkers.some((w) => !oldWorkers.includes(w))) {
        dirty = true;
    } else if (oldWorkers.some((w) => !newWorkers.includes(w))) {
        dirty = true;
    }

    if (dirty) {
        workers.clear();
        for (const worker of newWorkers) {
            workers.add(worker);
        }

        console.log('worker list has changed');
        await refreshJobs(workerIds, jobFilePath);
    }
}

export async function watchJobs(workerIds: string[]) {
    await writeMyWorkers(workersFilePath, workerIds);
    setInterval(() => writeMyWorkers(workersFilePath, workerIds), 1000);

    chokidar
        .watch(jobFilePath, { ignoreInitial: true })
        .on('add', (path) => refreshJobs(workerIds, path))
        .on('change', (path) => refreshJobs(workerIds, path));

    chokidar
        .watch(workersFilePath, { ignoreInitial: true })
        .on('add', (path) => refreshWorkers(workerIds, path))
        .on('change', (path) => refreshWorkers(workerIds, path));

    refreshWorkers(workerIds, workersFilePath);

    return eventBus;
}
