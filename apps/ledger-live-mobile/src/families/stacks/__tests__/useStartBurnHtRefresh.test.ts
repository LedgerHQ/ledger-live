import { act, renderHook } from "@tests/test-renderer";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";
import {
  START_BURN_HT_REFRESH_INTERVAL_MS,
  useStartBurnHtRefresh,
} from "../StakingFlow/useStartBurnHtRefresh";

jest.mock("@ledgerhq/live-common/families/stacks/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/stacks/react"),
  fetchPoxInfo: jest.fn(),
}));

type PoxInfo = Awaited<ReturnType<typeof fetchPoxInfo>>;
const mockFetchPoxInfo = jest.mocked(fetchPoxInfo);
const poxInfo = (height: number) => ({ current_burnchain_block_height: height }) as PoxInfo;

/** A pending `fetchPoxInfo` call the test settles itself. */
function nextFetch() {
  let resolve!: (value: PoxInfo) => void;
  let reject!: (error: Error) => void;
  mockFetchPoxInfo.mockReturnValueOnce(
    new Promise<PoxInfo>((res, rej) => {
      resolve = res;
      reject = rej;
    }),
  );
  return { resolve, reject };
}

const settle = (fn: () => void) =>
  act(async () => {
    fn();
  });

describe("useStartBurnHtRefresh", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchPoxInfo.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves immediately, then again on every refresh interval", async () => {
    const onResolved = jest.fn();
    const first = nextFetch();
    renderHook(() => useStartBurnHtRefresh(true, onResolved));

    expect(mockFetchPoxInfo).toHaveBeenCalledTimes(1);
    await settle(() => first.resolve(poxInfo(900_000)));
    expect(onResolved).toHaveBeenLastCalledWith(900_000);

    const second = nextFetch();
    act(() => {
      jest.advanceTimersByTime(START_BURN_HT_REFRESH_INTERVAL_MS);
    });
    expect(mockFetchPoxInfo).toHaveBeenCalledTimes(2);
    await settle(() => second.resolve(poxInfo(900_030)));
    expect(onResolved).toHaveBeenLastCalledWith(900_030);
  });

  it("doesn't request anything while disabled", () => {
    renderHook(() => useStartBurnHtRefresh(false, jest.fn()));

    act(() => {
      jest.advanceTimersByTime(START_BURN_HT_REFRESH_INTERVAL_MS * 3);
    });

    expect(mockFetchPoxInfo).not.toHaveBeenCalled();
  });

  it("drops an in-flight response and stops refreshing once disabled", async () => {
    const onResolved = jest.fn();
    const inFlight = nextFetch();
    let enabled = true;
    const { rerender } = renderHook(() => useStartBurnHtRefresh(enabled, onResolved));

    // The flow moves on (ConnectDevice) before the request lands.
    enabled = false;
    rerender({});
    await settle(() => inFlight.resolve(poxInfo(900_000)));
    act(() => {
      jest.advanceTimersByTime(START_BURN_HT_REFRESH_INTERVAL_MS * 2);
    });

    expect(onResolved).not.toHaveBeenCalled();
    expect(mockFetchPoxInfo).toHaveBeenCalledTimes(1);
  });

  it("drops an in-flight response after unmounting", async () => {
    const onResolved = jest.fn();
    const inFlight = nextFetch();
    const { unmount } = renderHook(() => useStartBurnHtRefresh(true, onResolved));

    unmount();
    await settle(() => inFlight.resolve(poxInfo(900_000)));
    act(() => {
      jest.advanceTimersByTime(START_BURN_HT_REFRESH_INTERVAL_MS);
    });

    expect(onResolved).not.toHaveBeenCalled();
    expect(mockFetchPoxInfo).toHaveBeenCalledTimes(1);
  });

  it("surfaces a failure, then clears it once a retry succeeds", async () => {
    const onResolved = jest.fn();
    const failing = nextFetch();
    const { result } = renderHook(() => useStartBurnHtRefresh(true, onResolved));

    await settle(() => failing.reject(new Error("pox unavailable")));
    expect(result.current.poxError?.message).toBe("pox unavailable");

    const retried = nextFetch();
    act(() => {
      result.current.retry();
    });
    await settle(() => retried.resolve(poxInfo(900_000)));

    expect(result.current.poxError).toBeNull();
    expect(onResolved).toHaveBeenCalledWith(900_000);
  });

  it("ignores an older response that lands after a newer request", async () => {
    const onResolved = jest.fn();
    const older = nextFetch();
    const { result } = renderHook(() => useStartBurnHtRefresh(true, onResolved));

    const newer = nextFetch();
    act(() => {
      result.current.retry();
    });
    await settle(() => newer.resolve(poxInfo(900_100)));
    await settle(() => older.resolve(poxInfo(900_000)));

    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith(900_100);
  });

  it("ignores an older request's failure that lands after a newer request", async () => {
    const older = nextFetch();
    const { result } = renderHook(() => useStartBurnHtRefresh(true, jest.fn()));

    const newer = nextFetch();
    act(() => {
      result.current.retry();
    });
    await settle(() => newer.resolve(poxInfo(900_100)));
    await settle(() => older.reject(new Error("stale failure")));

    expect(result.current.poxError).toBeNull();
  });
});
