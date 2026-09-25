import type { MaybeFunction } from '@support/jest-allure2-reporter';
export interface TaskQueueConfig {
    readonly logError: (error: unknown) => void;
}
export declare class TaskQueue {
    #private;
    constructor(config: TaskQueueConfig);
    readonly flush: () => Promise<unknown>;
    readonly enqueueTask: <T>(task: MaybeFunction<Promise<T>>) => Promise<T>;
}
