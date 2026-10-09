type Monitor = typeof import("./jsThreadLagMonitor");

function loadMonitor(): Monitor {
  let monitor: Monitor | undefined;
  jest.isolateModules(() => {
    monitor = require("./jsThreadLagMonitor");
  });
  if (!monitor) throw new Error("jsThreadLagMonitor did not load");
  return monitor;
}

describe("jsThreadLagMonitor", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-09T10:00:00.000Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("samples with a repeating timer so Detox still sees the app as idle", () => {
    const setIntervalSpy = jest.spyOn(globalThis, "setInterval");
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");

    loadMonitor().initJsThreadLagMonitor();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("reports no lag while the JS thread keeps up", () => {
    const { initJsThreadLagMonitor, jsThreadLagStore } = loadMonitor();
    initJsThreadLagMonitor();

    jest.advanceTimersByTime(2000);

    expect(jsThreadLagStore.getSummary()).toMatchObject({ samples: 20, maxLagMs: 0 });
    expect(jsThreadLagStore.getBuckets()).toEqual([
      { timestamp: "2026-10-09T10:00:00.000Z", samples: 9, meanLagMs: 0, maxLagMs: 0 },
      { timestamp: "2026-10-09T10:00:01.000Z", samples: 10, meanLagMs: 0, maxLagMs: 0 },
      { timestamp: "2026-10-09T10:00:02.000Z", samples: 1, meanLagMs: 0, maxLagMs: 0 },
    ]);
  });

  it("records a blocked JS thread as lag in the second it was observed", () => {
    const { initJsThreadLagMonitor, jsThreadLagStore } = loadMonitor();
    initJsThreadLagMonitor();

    jest.advanceTimersByTime(300);
    // The thread is blocked for 1.2s: the next tick fires 1.2s past its due time.
    jest.setSystemTime(Date.now() + 1200);
    jest.advanceTimersByTime(100);

    expect(jsThreadLagStore.getSummary()).toMatchObject({
      samples: 4,
      maxLagMs: 1200,
      samplesOver100Ms: 1,
      samplesOver500Ms: 1,
      samplesOver1000Ms: 1,
    });
    expect(jsThreadLagStore.getBuckets().at(-1)).toEqual({
      timestamp: "2026-10-09T10:00:01.000Z",
      samples: 1,
      meanLagMs: 1200,
      maxLagMs: 1200,
    });
  });
});
