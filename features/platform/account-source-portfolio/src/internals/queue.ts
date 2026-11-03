export type SerialQueue = {
  run<T>(task: () => Promise<T>): Promise<T>;
};

/** Runs one task at a time, in call order; a failed task does not block the next. */
export function createSerialQueue(): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run(task) {
      const running = tail.then(task);
      tail = running.catch(() => undefined);
      return running;
    },
  };
}
