import type { MaybeFunction } from '@support/jest-allure2-reporter';

export interface TaskQueueConfig {
  readonly logError: (error: unknown) => void;
}

export class TaskQueue {
  #idle: Promise<unknown> = Promise.resolve();
  #logError: (error: unknown) => void;

  constructor(config: TaskQueueConfig) {
    this.#logError = config.logError;
  }

  readonly flush = () => this.#idle;

  readonly enqueueTask = <T>(task: MaybeFunction<Promise<T>>): Promise<T> => {
    const result = (this.#idle =
      typeof task === 'function' ? this.#idle.then<T>(task) : this.#idle.then<T>(() => task));

    this.#idle = this.#idle.catch(this.#logError);
    return result;
  };
}
