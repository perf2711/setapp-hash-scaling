import EventEmitter from 'node:events';
import TypedEmitter from 'typed-emitter';

type Events = {
    'job-added'(job: string): void;
    'job-removed'(job: string): void;
};

export const eventBus = new EventEmitter() as TypedEmitter<Events>;
