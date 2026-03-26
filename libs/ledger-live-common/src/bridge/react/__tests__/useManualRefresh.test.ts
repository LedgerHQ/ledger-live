/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
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
  it("should return false when idle (no click, no pending)", () => {
    const { result } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    expect(result.current).toBe(false);
  });

  it("should latch true on click, stay true while pending, then return false when sync completes", () => {
    const now = Date.now();
    const { result, rerender } = renderManualRefresh({
      stableSyncPending: false,
      lastUserSyncClickTimestamp: 0,
    });

    // User clicks refresh
    rerender({ stableSyncPending: false, lastUserSyncClickTimestamp: now });
    expect(result.current).toBe(true);

    // Sync starts
    rerender({ stableSyncPending: true, lastUserSyncClickTimestamp: now });
    expect(result.current).toBe(true);

    // Sync completes
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
