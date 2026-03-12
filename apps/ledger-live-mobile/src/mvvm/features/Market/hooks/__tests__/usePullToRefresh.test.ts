import { renderHook, act } from "@tests/test-renderer";
import { track } from "~/analytics";
import usePullToRefresh from "../usePullToRefresh";

const mockedTrack = jest.mocked(track);

describe("usePullToRefresh", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialise with refreshControlVisible as false", () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => usePullToRefresh({ loading: false, refetch }));

    expect(result.current.refreshControlVisible).toBe(false);
  });

  it("should call refetch and set refreshControlVisible to true on pull", () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => usePullToRefresh({ loading: false, refetch }));

    act(() => {
      result.current.handlePullToRefresh();
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(result.current.refreshControlVisible).toBe(true);
  });

  it("should track button_clicked analytics event on pull", () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => usePullToRefresh({ loading: false, refetch }));

    act(() => {
      result.current.handlePullToRefresh();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "pull to refresh" });
  });

  it("should reset refreshControlVisible when loading cycle completes", () => {
    let loading = false;
    const refetch = jest.fn();
    const { result, rerender } = renderHook(() => usePullToRefresh({ loading, refetch }));

    act(() => {
      result.current.handlePullToRefresh();
    });

    expect(result.current.refreshControlVisible).toBe(true);

    loading = true;
    rerender({});

    loading = false;
    rerender({});

    expect(result.current.refreshControlVisible).toBe(false);
  });

  it("should reset refreshControlVisible via timeout fallback when loading never starts", () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => usePullToRefresh({ loading: false, refetch }));

    act(() => {
      result.current.handlePullToRefresh();
    });

    expect(result.current.refreshControlVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.refreshControlVisible).toBe(false);
  });
});
