export interface DeferredTaskQueueConfig<P, T> {
    /**
     * Gets a unique thread name for a payload. Tasks in the same thread run sequentially.
     */
    getThreadName: (payload: P) => string;
    /**
     * Executes the task for a payload. Must return a Promise.
     */
    execute: (payload: P) => Promise<void>;
    /**
     * Gets a unique key for a payload. Used for tracking.
     */
    getPayloadKey: (payload: P) => T;
}
export declare class DeferredTaskQueue<P, T> {
    private readonly pendingPayloads;
    private readonly executingTasks;
    private readonly processedPayloads;
    private readonly config;
    private readonly threadTailPromises;
    constructor(config: DeferredTaskQueueConfig<P, T>);
    private _getPayloadKey;
    /**
     * Starts payload execution, chaining it in its thread and tracking its promise.
     * @param payload Payload to execute.
     * @param threadName Thread for this payload.
     */
    private _startExecutionAndTrack;
    /**
     * Adds a payload to the queue.
     * If a payload for the same thread was pending, it starts. The new payload becomes pending.
     * Does not await started tasks.
     * @param payload Payload to enqueue.
     */
    enqueue(payload: P): void;
    /**
     * Starts pending payloads.
     * If threadName is given, starts tasks for that thread only. Otherwise, starts all pending.
     * Does not await task completion.
     * @param threadName Optional. Specific thread to start.
     */
    startPending(threadName?: string): void;
    /**
     * Waits for all currently executing tasks to complete.
     * Does not start new tasks. Resolves when all tasks finish (or rejects if any task fails).
     */
    awaitCompletion(): Promise<void>;
}
