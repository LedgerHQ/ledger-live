/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook, act } from "@testing-library/react";
import { useBalanceSyncState } from "./useBalanceSyncState";
import type { SyncPhase } from "./useSyncLifecycle";

interface Props {
  rawBalanceAvailable: boolean;
  syncPhase: SyncPhase;
  latestBalance: number;
  shouldFreezeOnSync: boolean;
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
    it("should be true when syncPhase is syncing", () => {
      const { result } = renderBalanceSyncState({ syncPhase: "syncing" });
      expect(result.current.isLoading).toBe(true);
    });

    it("should be false when syncPhase is synced", () => {
      const { result } = renderBalanceSyncState({ syncPhase: "synced" });
      expect(result.current.isLoading).toBe(false);
    });

    it("should be false when syncPhase is failed", () => {
      const { result } = renderBalanceSyncState({ syncPhase: "failed" });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("sticky balanceAvailable", () => {
    it("should be true when rawBalanceAvailable is true and not syncing", () => {
      const { result } = renderBalanceSyncState({
        rawBalanceAvailable: true,
        syncPhase: "synced",
      });
      expect(result.current.balanceAvailable).toBe(true);
    });

    it("should be false when rawBalanceAvailable is false", () => {
      const { result } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
      });
      expect(result.current.balanceAvailable).toBe(false);
    });

    it("should stay false when rawBalanceAvailable becomes true but sync is still ongoing", () => {
      const { result, rerender } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
      });
      expect(result.current.balanceAvailable).toBe(false);

      rerender({ ...defaultProps, rawBalanceAvailable: true, syncPhase: "syncing" });
      expect(result.current.balanceAvailable).toBe(false);
    });

    it("should become true once rawBalanceAvailable is true and sync settles", () => {
      const { result, rerender } = renderBalanceSyncState({
        rawBalanceAvailable: false,
        syncPhase: "syncing",
      });
      expect(result.current.balanceAvailable).toBe(false);

      rerender({ ...defaultProps, rawBalanceAvailable: true, syncPhase: "syncing" });
      expect(result.current.balanceAvailable).toBe(false);

      rerender({ ...defaultProps, rawBalanceAvailable: true, syncPhase: "synced" });
      expect(result.current.balanceAvailable).toBe(true);
    });

    it("should go back to false when rawBalanceAvailable drops during a new sync", () => {
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
    it("should freeze balance during syncing when shouldFreezeOnSync is true", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "synced",
        latestBalance: 1500,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 2000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);
    });

    it("should unfreeze balance when sync settles", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "synced",
        latestBalance: 1500,
        shouldFreezeOnSync: true,
      });

      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 2000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      rerender({
        ...defaultProps,
        syncPhase: "synced",
        latestBalance: 2000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(2000);
    });

    it("should keep balance frozen during settle guard (syncPhase stays syncing)", () => {
      const { result, rerender } = renderBalanceSyncState({
        syncPhase: "synced",
        latestBalance: 1500,
        shouldFreezeOnSync: true,
      });

      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 2500,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

      // Balance changes again while still syncing
      rerender({
        ...defaultProps,
        syncPhase: "syncing",
        latestBalance: 3000,
        shouldFreezeOnSync: true,
      });
      expect(result.current.displayedBalance).toBe(1500);

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
});
