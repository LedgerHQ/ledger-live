import { renderHook } from "tests/testSetup";
import { useManualRefreshLoading } from "../useManualRefreshLoading";

interface Props {
  stableSyncPending: boolean;
  lastUserSyncClickTimestamp: number;
}

function renderManualRefresh(initialProps: Props) {
  return renderHook(
    (props: Props) =>
      useManualRefreshLoading(props.stableSyncPending, props.lastUserSyncClickTimestamp),
    { initialProps },
  );
}

describe("useManualRefreshLoading", () => {
  it("returns false on initial render when no click has happened", () => {
    const { result } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    expect(result.current).toBe(false);
  });

  it("returns true when timestamp changes (user clicks refresh)", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });

    expect(result.current).toBe(true);
  });

  it("does not trigger on mount when timestamp is already non-zero", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 5000,
    });

    expect(result.current).toBe(false);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 6000 });
    expect(result.current).toBe(true);
  });

  it("returns false when sync is pending but no click occurred", () => {
    const { result } = renderManualRefresh({
      stableSyncPending: true,
      lastUserSyncClickTimestamp: 0,
    });

    expect(result.current).toBe(false);
  });

  it("stays true while sync is still pending after click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);
  });

  it("returns false after sync completes (pending: true → false) following a click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(false);
  });

  it("does not release until sync has been pending at least once after click", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(false);
  });

  it("re-triggers on a second click after the first cycle completes", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(false);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 2000 });
    expect(result.current).toBe(true);
  });

  it("stays loading through a second click while sync is still running", () => {
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 1000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: 2000 });
    expect(result.current).toBe(true);

    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: 2000 });
    expect(result.current).toBe(false);
  });
});
