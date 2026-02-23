import React from "react";
import { AppState } from "react-native";
import { render, act } from "@tests/test-renderer";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { JsThreadMonitor } from "../index";

const mockRemove = jest.fn();

let mockNow = 0;

jest.mock("@ledgerhq/live-common/hooks/useEnv", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useEnvMock = jest.mocked(useEnv);

describe("JsThreadMonitor Integration", () => {
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

    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
    jest.spyOn(AppState, "addEventListener").mockImplementation(() => {
      return { remove: mockRemove };
    });
  });

  function advanceTicks(count: number, driftMs = 0) {
    for (let i = 0; i < count; i++) {
      mockNow += 100 + driftMs;
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }
  }

  it("should render nothing when JS_THREAD_MONITOR is disabled", () => {
    useEnvMock.mockReturnValue(false);

    const { queryByText } = render(<JsThreadMonitor />);

    expect(queryByText("-")).toBeNull();
    expect(queryByText("%")).toBeNull();
  });

  it("should render placeholder values before enough samples are collected", () => {
    useEnvMock.mockReturnValue(true);

    const { getAllByText } = render(<JsThreadMonitor />);

    // Both stallPercentage and maxStall should show the placeholder
    const placeholders = getAllByText("-");
    expect(placeholders.length).toBe(2);
  });

  it("should render actual metrics after enough samples", () => {
    useEnvMock.mockReturnValue(true);

    const { getByText } = render(<JsThreadMonitor />);

    // Advance 3 ticks (MIN_SAMPLES) with no drift
    advanceTicks(3);

    expect(getByText("0.0%")).toBeTruthy();
    expect(getByText("0ms")).toBeTruthy();
  });

  it("should display stall metrics when the JS thread is blocked", () => {
    useEnvMock.mockReturnValue(true);

    const { getByText } = render(<JsThreadMonitor />);

    // 9 normal ticks + 1 stall tick with 100ms drift
    advanceTicks(9);
    mockNow += 100 + 100; // 100ms interval + 100ms drift
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // stall% = 100 / (10 * 100) * 100 = 10%
    expect(getByText("10.0%")).toBeTruthy();
    expect(getByText("100ms")).toBeTruthy();
  });

  it("should not start the timer when the env is disabled", () => {
    useEnvMock.mockReturnValue(false);

    render(<JsThreadMonitor />);

    // AppState listener should not be registered when disabled
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });
});
