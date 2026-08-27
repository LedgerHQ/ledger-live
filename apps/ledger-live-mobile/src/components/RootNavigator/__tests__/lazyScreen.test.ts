import { scheduleIdleLoads, scheduleNamedPreloads } from "../lazyScreen";

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

describe("scheduleNamedPreloads", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should stagger navigation.preload calls", () => {
    jest.useFakeTimers();
    const preloaded: string[] = [];

    scheduleNamedPreloads(["Swap", "Earn", "Pay"], name => {
      preloaded.push(name);
    });

    expect(preloaded).toEqual([]);
    jest.advanceTimersByTime(250);
    expect(preloaded).toEqual(["Swap"]);
    jest.advanceTimersByTime(400);
    expect(preloaded).toEqual(["Swap", "Earn"]);
    jest.advanceTimersByTime(400);
    expect(preloaded).toEqual(["Swap", "Earn", "Pay"]);
  });
});
