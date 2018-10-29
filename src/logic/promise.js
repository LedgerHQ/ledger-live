// @flow

// TODO put it back in live-common

export const delay = (ms: number): Promise<void> =>
  new Promise(f => setTimeout(f, ms));

type Job<R, A> = (...args: A) => Promise<R>;

export const atomicQueue = <R, A: Array<*>>(
  job: Job<R, A>,
  queueIdentifier: (...args: A) => string = () => "",
): Job<R, A> => {
  const queues = {};
  return (...args) => {
    const id = queueIdentifier(...args);
    const queue = queues[id] || Promise.resolve();
    const p = queue.then(() => job(...args));
    queues[id] = p.catch(() => {});
    return p;
  };
};
