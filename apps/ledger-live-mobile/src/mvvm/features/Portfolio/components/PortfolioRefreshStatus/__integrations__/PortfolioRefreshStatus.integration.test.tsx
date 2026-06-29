// Bypass Reanimated animations entirely so tests focus on rendered content,
// not on animated opacity/height transitions.
jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  const Easing = {
    ease: {},
    inOut: (e: unknown) => e,
    bezier: () => ({}),
  };
  return {
    __esModule: true,
    Easing,
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    useAnimatedReaction: () => {},
    withTiming: (toValue: unknown) => toValue,
    withRepeat: (animation: unknown) => animation,
    withDelay: (_delay: number, animation: unknown) => animation,
    withSpring: (toValue: unknown) => toValue,
    cancelAnimation: () => {},
    useReducedMotion: () => false,
    default: {
      View: RN.View,
      Text: RN.Text,
      Image: RN.Image,
      ScrollView: RN.ScrollView,
      createAnimatedComponent: (Comp: unknown) => Comp,
    },
  };
});

import React from "react";
import { render, screen, act, withFlagOverrides } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import { REFRESH_STATUS_VISIBLE_DURATION_MS } from "../usePortfolioRefreshStatusViewModel";
import { PortfolioRefreshStatus } from "../index";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import { State } from "~/reducers/types";

// In the rework (lwmWallet40, on by default) refreshing / up-to-date are driven by the sync
// lifecycle from usePortfolioBalance, not by redux — so we mock its syncPhase.
jest.mock("LLM/hooks/usePortfolioBalance");

const mockBalance = (syncPhase: SyncPhase, isManualRefreshLoading = false) =>
  jest.mocked(usePortfolioBalanceModule.usePortfolioBalance).mockReturnValue({
    syncPhase,
    isManualRefreshLoading,
  } as ReturnType<typeof usePortfolioBalanceModule.usePortfolioBalance>);

const FIXED_NOW = new Date("2025-08-15T12:00:00Z").getTime();

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeAccount = (lastSyncDate: Date) => ({
  ...genAccount("test-sync-account"),
  lastSyncDate,
});

const withBalanceRefreshRework = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { balanceRefreshRework: true } },
});

const withIdle =
  (lastSyncDate: Date): ((state: State) => State) =>
  state => ({
    ...state,
    accounts: {
      ...state.accounts,
      active: [makeAccount(lastSyncDate)],
    },
    portfolioRefresh: {
      isRefreshing: false,
      lastSyncTimestampSnapshot: null,
      hasCompletedInitialSync: false,
      lastUserSyncClickTimestamp: 0,
      lastOfflineRefreshAttemptTimestamp: 0,
    },
  });

const withOfflineAttempt = (): ((state: State) => State) => state =>
  withBalanceRefreshRework({
    ...state,
    portfolioRefresh: {
      isRefreshing: false,
      lastSyncTimestampSnapshot: null,
      hasCompletedInitialSync: false,
      lastUserSyncClickTimestamp: 0,
      lastOfflineRefreshAttemptTimestamp: FIXED_NOW,
    },
  });

const renderRefreshing = () => {
  mockBalance("syncing", true);
  return render(<PortfolioRefreshStatus />, {
    overrideInitialState: withBalanceRefreshRework,
  });
};

const completeRefresh = (rerender: ReturnType<typeof renderRefreshing>["rerender"]) => {
  mockBalance("synced");
  act(() => {
    rerender(<PortfolioRefreshStatus />);
  });
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PortfolioRefreshStatus", () => {
  beforeEach(() => {
    jest.setSystemTime(FIXED_NOW);
    mockBalance("synced");
  });

  describe("idle state", () => {
    it("should render the container but show no content", () => {
      render(<PortfolioRefreshStatus />);
      expect(screen.getByTestId("portfolio-refresh-status")).toBeTruthy();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-refreshing")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });

    it("should not show up-to-date when mounted with a completed timestamp but no prior refresh", () => {
      render(<PortfolioRefreshStatus />, {
        overrideInitialState: withIdle(new Date(Date.now() - 30_000)),
      });
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });

  describe("refreshing state", () => {
    it("should show spinner and 'Refreshing...' label", () => {
      renderRefreshing();
      expect(screen.getByTestId("portfolio-refresh-status-spinner")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-refreshing")).toBeVisible();
      expect(screen.getByText("Refreshing...")).toBeVisible();
    });
  });

  describe("offline state", () => {
    it("should show warning icon and offline message when a pull-to-refresh is attempted offline", () => {
      render(<PortfolioRefreshStatus />, { overrideInitialState: withOfflineAttempt() });

      const offlineEl = screen.getByTestId("portfolio-refresh-status-offline");
      expect(offlineEl).toBeVisible();
      expect(offlineEl).toHaveTextContent(/offline/i);
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
    });

    it("should hide the offline message after the visibility duration elapses", () => {
      render(<PortfolioRefreshStatus />, { overrideInitialState: withOfflineAttempt() });

      expect(screen.getByTestId("portfolio-refresh-status-offline")).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(REFRESH_STATUS_VISIBLE_DURATION_MS);
      });

      expect(screen.queryByTestId("portfolio-refresh-status-offline")).toBeNull();
    });
  });

  describe("up-to-date state", () => {
    it("should show checkmark and 'You're up to date' without spinner right after refresh completes", () => {
      const { rerender } = renderRefreshing();
      completeRefresh(rerender);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();
      expect(screen.getByText("Portfolio up to date")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-checkmark")).toBeTruthy();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
    });

    it("should hide after the visibility duration elapses", () => {
      const { rerender } = renderRefreshing();
      completeRefresh(rerender);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(REFRESH_STATUS_VISIBLE_DURATION_MS);
      });

      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });
});
