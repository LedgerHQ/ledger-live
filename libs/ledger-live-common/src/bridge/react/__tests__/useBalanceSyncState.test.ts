/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import { useBalanceSyncState } from "../useBalanceSyncState";
import type { SyncPhase } from "../useSyncLifecycle";

interface Props {
  rawBalanceAvailable: boolean;
  syncPhase: SyncPhase;
  latestBalance: number;
  shouldFreezeOnSync: boolean;
  cvPending?: boolean;
}

const defaultProps: Props = {
  rawBalanceAvailable: true,
  syncPhase: "synced",
  latestBalance: 1000,
  shouldFreezeOnSync: true,
};

function renderBalanceSyncState(overrides: Partial<Props> = {}) {
  const initialProps = { ...defaultProps, ...overrides };
  return renderHook((props: Props) => useBalanceSyncState(props), { initialProps });
}

describe("useBalanceSyncState", () => {
  describe("isLoading", () => {
    it.each([
      { syncPhase: "syncing" as SyncPhase, expected: true },
      { syncPhase: "synced" as SyncPhase, expected: false },
      { syncPhase: "failed" as SyncPhase, expected: false },
    ])("should be $expected when syncPhase is $syncPhase", ({ syncPhase, expected }) => {
      const { result } = renderBalanceSyncState({ syncPhase });
      expect(result.current.isLoading).toBe(expected);
    });
  });

  describe("sticky balanceAvailable", () => {
    it("should reflect rawBalanceAvailable when settled", () => {
      const { result: available } = renderBalanceSyncState({
        rawBalanceAvailable: true,
        syncPhase: "synced",
      });
      expect(available.current.balanceAvailable).toBe(true);

      const { result: unavailable } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
      });
      expect(unavailable.current.balanceAvailable).toBe(false);
    });

    it("stays false until rawBalanceAvailable is true AND sync settles (no shimmer gap)", () => {
      const { result, rerender } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
      });
      expect(result.current.balanceAvailable).toBe(false);

      // Balance becomes available mid-sync — still blocked
      rerender({ ...defaultProps, rawBalanceAvailable: true, syncPhase: "syncing" });
      expect(result.current.balanceAvailable).toBe(false);

      // Sync settles — now unlocks
      rerender({ ...defaultProps, rawBalanceAvailable: true, syncPhase: "synced" });
      expect(result.current.balanceAvailable).toBe(true);
    });

    it("goes back to false when rawBalanceAvailable drops during a new sync", () => {
      const { result, rerender } = renderBalanceSyncState({
        rawBalanceAvailable: true,
        syncPhase: "synced",
      });
      expect(result.current.balanceAvailable).toBe(true);

      rerender({ ...defaultProps, rawBalanceAvailable: false, syncPhase: "syncing" });
      expect(result.current.balanceAvailable).toBe(false);
    });
  });

  describe("frozen balance", () => {
    it("freezes on sync start, holds through balance changes, then releases on settle", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "synced",
        latestBalance: 1500,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      // Sync starts — balance is frozen at 1500
      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 2000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      // Balance changes again while still syncing — still frozen
      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 3000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      // Sync settles — releases latest value
      rerender({
        ...defaultProps,
        syncPhase: "synced",
        latestBalance: 3000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(3000);
    });

    it("should not freeze balance when shouldFreezeOnSync is false", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "synced",
        latestBalance: 1500,
        shouldFreezeOnSync: false,
      });
      expect(result.current.displayedBalance).toBe(1500);

      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 2000,
        shouldFreezeOnSync: false,
      });
      expect(result.current.displayedBalance).toBe(2000);
    });
  });

  describe("cvPending override (mobile CVS-phase behaviour)", () => {
    it("freezes while cvPending is true and releases once false, regardless of syncPhase", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "syncing",
        latestBalance: 1000,
        shouldFreezeOnSync: true,
        cvPending: true,
      });
      expect(result.current.displayedBalance).toBe(1000);

      // Balance updated by CVS — still frozen while cvPending
      rerender({ ...defaultProps, syncPhase: "syncing", latestBalance: 1200, cvPending: true });
      expect(result.current.displayedBalance).toBe(1000);

      // CVS settles — balance animates even though bridge sync (syncPhase) is still active
      rerender({ ...defaultProps, syncPhase: "syncing", latestBalance: 1200, cvPending: false });
      expect(result.current.displayedBalance).toBe(1200);

      // Balance continues to update per-batch after CVS settles
      rerender({ ...defaultProps, syncPhase: "syncing", latestBalance: 1500, cvPending: false });
      expect(result.current.displayedBalance).toBe(1500);
    });

    it("clears sticky balanceUnavailable once cvPending is false (no balance case)", () => {
      const { result, rerender } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
        latestBalance: 0,
        shouldFreezeOnSync: true,
        cvPending: true,
      });
      expect(result.current.balanceAvailable).toBe(false);

      // Balance becomes available mid-sync but CVS still pending — still blocked
      rerender({
        ...defaultProps,
        rawBalanceAvailable: true,
        syncPhase: "syncing",
        cvPending: true,
      });
      expect(result.current.balanceAvailable).toBe(false);

      // CVS settles — balance unlocks immediately even with bridge sync still running
      rerender({
        ...defaultProps,
        rawBalanceAvailable: true,
        syncPhase: "syncing",
        cvPending: false,
      });
      expect(result.current.balanceAvailable).toBe(true);
    });
  });
});
