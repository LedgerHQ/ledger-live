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

export class DeferredTaskQueue<P, T> {
  private readonly pendingPayloads: Map<string, P> = new Map();
  private readonly executingTasks: Map<T, Promise<void>> = new Map();
  private readonly processedPayloads: Set<T> = new Set();
  private readonly config: DeferredTaskQueueConfig<P, T>;
  private readonly threadTailPromises: Map<string, Promise<void>> = new Map();

  constructor(config: DeferredTaskQueueConfig<P, T>) {
    this.config = config;
  }

  private _getPayloadKey(payload: P): T {
    return this.config.getPayloadKey(payload);
  }

  /**
   * Starts payload execution, chaining it in its thread and tracking its promise.
   * @param payload Payload to execute.
   * @param threadName Thread for this payload.
   */
  private _startExecutionAndTrack(payload: P, threadName: string): void {
    const payloadKey = this._getPayloadKey(payload);

    if (this.executingTasks.has(payloadKey)) {
      return;
    }

    const predecessorPromiseInThread = this.threadTailPromises.get(threadName) || Promise.resolve();

    const taskExecutor = () => this.config.execute(payload);

    // Chain the current task to the predecessor in the same thread.
    // If predecessorPromiseInThread rejects, taskExecutor will not run.
    const executionChainPromise = predecessorPromiseInThread.then(taskExecutor);

    // This finalPromise is what gets stored and returned. It includes cleanup.
    const finalPromise = executionChainPromise.then(
      () => {
        this.processedPayloads.add(payloadKey);
        this.executingTasks.delete(payloadKey);
      },
      () => {
        this.executingTasks.delete(payloadKey);
      },
    );

    this.executingTasks.set(payloadKey, finalPromise);
    // This task's promise becomes the new tail for this thread.
    this.threadTailPromises.set(threadName, finalPromise);
  }

  /**
   * Adds a payload to the queue.
   * If a payload for the same thread was pending, it starts. The new payload becomes pending.
   * Does not await started tasks.
   * @param payload Payload to enqueue.
   */
  public enqueue(payload: P): void {
    const key = this._getPayloadKey(payload);
    if (this.processedPayloads.has(key)) {
      // Payload with this key has already been processed, ignore it.
      return;
    }

    const threadName = this.config.getThreadName(payload);
    const previousPayload = this.pendingPayloads.get(threadName);

    // Set the new payload as the currently pending one for this thread.
    this.pendingPayloads.set(threadName, payload);

    if (previousPayload !== undefined) {
      // A new payload has superseded `previousPayload` for this thread.
      // Execute `previousPayload` now. It will be chained correctly by _startExecutionAndTrack.
      this._startExecutionAndTrack(previousPayload, threadName);
    }
  }

  /**
   * Starts pending payloads.
   * If threadName is given, starts tasks for that thread only. Otherwise, starts all pending.
   * Does not await task completion.
   * @param threadName Optional. Specific thread to start.
   */
  public startPending(threadName?: string): void {
    const payloadsToStart: { payload: P; threadName: string }[] = [];

    if (threadName) {
      const payload = this.pendingPayloads.get(threadName);
      if (payload) {
        payloadsToStart.push({ payload, threadName });
        this.pendingPayloads.delete(threadName);
      }
    } else {
      for (const [tName, payload] of this.pendingPayloads) {
        payloadsToStart.push({ payload, threadName: tName });
      }
      this.pendingPayloads.clear();
    }

    for (const { payload, threadName: tn } of payloadsToStart) {
      this._startExecutionAndTrack(payload, tn);
    }
  }

  /**
   * Waits for all currently executing tasks to complete.
   * Does not start new tasks. Resolves when all tasks finish (or rejects if any task fails).
   */
  public async awaitCompletion(): Promise<void> {
    if (this.executingTasks.size > 0) {
      const promises = [...this.executingTasks.values()];
      await Promise.all(promises);
    }
  }
}
