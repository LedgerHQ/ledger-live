export class WorkerPool {
  private readonly freeWorkers: WebdriverIO.Capabilities[];

  private queue: Array<(capa: WebdriverIO.Capabilities) => void> = [];
  private busyWorkers = new Map<string, WebdriverIO.Capabilities>();

  constructor(freeWorkers: WebdriverIO.Capabilities[]) {
    this.freeWorkers = freeWorkers;
  }

  public async acquire(cid: string): Promise<WebdriverIO.Capabilities> {
    const worker = this.freeWorkers.pop();
    if (worker !== undefined) {
      this.busyWorkers.set(cid, worker);
      return Promise.resolve(worker);
    }
    return new Promise<WebdriverIO.Capabilities>(resolve => {
      this.queue.push((s: WebdriverIO.Capabilities) => {
        this.busyWorkers.set(cid, s);
        resolve(s);
      });
    });
  }

  public release(cid: string): void {
    const worker = this.busyWorkers.get(cid);
    if (worker === undefined) return;
    this.busyWorkers.delete(cid);
    const next = this.queue.shift();
    if (next) next(worker);
    else this.freeWorkers.push(worker);
  }
}

export default WorkerPool;
