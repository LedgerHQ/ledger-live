// @flow

export const delay = (ms: number): Promise<void> =>
  new Promise(f => setTimeout(f, ms));

type Job<R, A> = (...args: A) => Promise<R>;

export const atomicQueue = <R, A: Array<*>>(job: Job<R, A>): Job<R, A> => {
  let queue = Promise.resolve();
  return (...args) => {
    const p = queue.then(() => job(...args));
    queue = p.catch(() => {});
    return p;
  };
};
