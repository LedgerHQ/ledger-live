import { renderHook } from "tests/testSetup";
import { useManualRefresh } from "../useManualRefresh";

interface Props {
  stableSyncPending: boolean;
  lastUserSyncClickTimestamp: number;
}

function renderManualRefresh(initialProps: Props) {
  return renderHook(
    (props: Props) => useManualRefresh(props.stableSyncPending, props.lastUserSyncClickTimestamp),
    { initialProps },
  );
}

describe("useManualRefresh", () => {
  it("should return false when idle", () => {
    const { result } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    expect(result.current).toBe(false);
  });

  it("should return true after user click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: Date.now() });

    expect(result.current).toBe(true);
  });

  it("should return true while sync is pending after click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: Date.now() });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: Date.now() });
    expect(result.current).toBe(true);
  });

  it("should return false after sync completes following click", () => {
    const now = Date.now();
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: now });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: now });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: now });
    expect(result.current).toBe(false);
  });

  it("should not latch when sync pending without prior click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 0 });
    expect(result.current).toBe(false);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 0 });
    expect(result.current).toBe(false);
  });
});
