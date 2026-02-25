import { renderHook, act } from "@tests/test-renderer";
import { AppState, AppStateStatus } from "react-native";
import { useJsThreadMonitor } from "../useJsThreadMonitor";

let appStateCallback: ((state: AppStateStatus) => void) | null = null;
const mockRemove = jest.fn();

let mockNow = 0;

describe("useJsThreadMonitor", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 0;
    appStateCallback = null;

    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, callback) => {
      appStateCallback = callback;
      return { remove: mockRemove };
    });
  });

  function advanceTick(driftMs = 0) {
    mockNow += 100 + driftMs;
    act(() => {
      jest.advanceTimersByTime(100);
    });
  }

  it("should return null metrics initially", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    expect(result.current.stallPercentage).toBeNull();
    expect(result.current.maxStall).toBeNull();
  });

  it("should return null metrics until MIN_SAMPLES (3) ticks have passed", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    advanceTick();
    expect(result.current.stallPercentage).toBeNull();

    advanceTick();
    expect(result.current.stallPercentage).toBeNull();

    advanceTick();
    expect(result.current.stallPercentage).not.toBeNull();
  });

  it("should report 0% stall when there is no drift", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    for (let i = 0; i < 5; i++) advanceTick(0);

    expect(result.current.stallPercentage).toBe(0);
    expect(result.current.maxStall).toBe(0);
  });

  it("should detect a stall when drift exceeds the threshold (50ms)", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    // 3 normal ticks to pass MIN_SAMPLES
    advanceTick(0);
    advanceTick(0);
    advanceTick(0);

    // 1 stall tick: 100ms interval + 200ms drift = 300ms elapsed
    advanceTick(200);

    expect(result.current.stallPercentage).toBeGreaterThan(0);
    expect(result.current.maxStall).toBe(200);
  });

  it("should track the worst single stall in the window", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    advanceTick(0);
    advanceTick(100); // stall: 100ms drift
    advanceTick(0);
    advanceTick(300); // stall: 300ms drift (worst)
    advanceTick(0);

    expect(result.current.maxStall).toBe(300);
  });

  it("should compute correct stall percentage", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    // 10 ticks total: 9 normal + 1 with 100ms drift
    for (let i = 0; i < 9; i++) advanceTick(0);
    advanceTick(100);

    // Total stall time: 100ms, window duration: 10 * 100ms = 1000ms
    // Stall percentage: 100 / 1000 * 100 = 10%
    expect(result.current.stallPercentage).toBe(10);
  });

  it("should maintain a rolling window of at most WINDOW_SIZE (100) samples", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    // First tick is a large stall
    advanceTick(500);

    // Fill the rest of the window with normal ticks (99 more)
    for (let i = 0; i < 99; i++) advanceTick(0);

    // Stall should still be visible
    expect(result.current.maxStall).toBe(500);

    // One more tick pushes the stall out of the window
    advanceTick(0);

    expect(result.current.maxStall).toBe(0);
  });

  it("should discard the first tick after returning from background", () => {
    const { result } = renderHook(() => useJsThreadMonitor());

    // A few normal ticks
    for (let i = 0; i < 5; i++) advanceTick(0);

    // Simulate backgrounding: trigger AppState change to "background" then "active"
    act(() => {
      appStateCallback?.("background");
    });

    // Simulate 10s in background
    mockNow += 10_000;

    act(() => {
      appStateCallback?.("active");
    });

    // Next tick fires — should be discarded (its drift would be ~10s)
    advanceTick(0);

    // The massive background time should NOT appear as a stall
    expect(result.current.maxStall).toBe(0);
    expect(result.current.stallPercentage).toBe(0);
  });
});
