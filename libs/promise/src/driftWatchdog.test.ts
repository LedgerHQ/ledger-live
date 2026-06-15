import { createDriftWatchdog } from "./driftWatchdog";

describe("createDriftWatchdog", () => {
  let mockNow = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNow = 0;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("reports elapsed time between ticks", () => {
    const onTick = jest.fn();
    const watchdog = createDriftWatchdog({ tickIntervalMs: 1_000, onTick });

    watchdog.start();
    expect(onTick).not.toHaveBeenCalled();

    mockNow += 1_000;
    jest.advanceTimersByTime(1_000);
    expect(onTick).toHaveBeenCalledWith(1_000);

    mockNow += 1_200;
    jest.advanceTimersByTime(1_000);
    expect(onTick).toHaveBeenCalledWith(1_200);
  });

  it("stops scheduling ticks after stop()", () => {
    const onTick = jest.fn();
    const watchdog = createDriftWatchdog({ tickIntervalMs: 1_000, onTick });

    watchdog.start();
    mockNow += 1_000;
    jest.advanceTimersByTime(1_000);
    expect(onTick).toHaveBeenCalledTimes(1);

    watchdog.stop();
    mockNow += 5_000;
    jest.advanceTimersByTime(5_000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("syncBaseline discards elapsed since the previous tick", () => {
    const onTick = jest.fn();
    const watchdog = createDriftWatchdog({ tickIntervalMs: 1_000, onTick });

    watchdog.start();
    mockNow += 10_000;
    watchdog.syncBaseline();

    mockNow += 1_000;
    jest.advanceTimersByTime(1_000);
    expect(onTick).toHaveBeenCalledWith(1_000);
  });

  it("is a no-op when start is called twice", () => {
    const onTick = jest.fn();
    const watchdog = createDriftWatchdog({ tickIntervalMs: 1_000, onTick });

    watchdog.start();
    watchdog.start();

    mockNow += 1_000;
    jest.advanceTimersByTime(1_000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });
});
