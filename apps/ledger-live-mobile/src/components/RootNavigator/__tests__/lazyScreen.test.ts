import { scheduleIdleLoads } from "../lazyScreen";

describe("scheduleIdleLoads", () => {
  it("should run one loader per idle turn in order", () => {
    const queued: Array<() => void> = [];
    const loaded: string[] = [];

    scheduleIdleLoads(
      [() => loaded.push("swap"), () => loaded.push("earn"), () => loaded.push("pay")],
      cb => {
        queued.push(cb);
      },
    );

    expect(loaded).toEqual([]);
    queued.shift()?.();
    expect(loaded).toEqual(["swap"]);
    queued.shift()?.();
    expect(loaded).toEqual(["swap", "earn"]);
    queued.shift()?.();
    expect(loaded).toEqual(["swap", "earn", "pay"]);
    queued.shift()?.();
    expect(queued).toEqual([]);
  });
});
