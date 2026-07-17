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
    ReduceMotion: {
      System: "system",
      Always: "always",
      Never: "never",
    },
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
import { render, screen, act } from "@tests/test-renderer";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import { REFRESH_STATUS_VISIBLE_DURATION_MS } from "../usePortfolioRefreshStatusViewModel";
import { PortfolioRefreshStatus } from "../index";
import { State } from "~/reducers/types";

jest.mock("LLM/hooks/usePortfolioBalance");

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

const FIXED_NOW = new Date("2025-08-15T12:00:00Z").getTime();

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockSync(syncPhase: SyncPhase, isManualRefreshLoading = false) {
  mockUsePortfolioBalance.mockReturnValue({ syncPhase, isManualRefreshLoading } as ReturnType<
    typeof mockUsePortfolioBalance
  >);
}

const withOfflineAttempt = (): ((state: State) => State) => state => ({
  ...state,
  portfolioRefresh: {
    ...state.portfolioRefresh,
    lastOfflineRefreshAttemptTimestamp: FIXED_NOW,
  },
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PortfolioRefreshStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(FIXED_NOW);
    mockSync("synced");
  });

  describe("idle state", () => {
    it("should render the container but show no content", () => {
      render(<PortfolioRefreshStatus />);
      expect(screen.getByTestId("portfolio-refresh-status")).toBeTruthy();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-refreshing")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });

    it("should not show any content during cold start (syncing but no user trigger)", () => {
      mockSync("syncing", false);
      render(<PortfolioRefreshStatus />);
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });

  describe("refreshing state", () => {
    it("should show spinner and 'Refreshing...' label", () => {
      mockSync("syncing", true);
      render(<PortfolioRefreshStatus />);
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
      mockSync("syncing", true);
      const { rerender } = render(<PortfolioRefreshStatus />);

      mockSync("synced");
      rerender(<PortfolioRefreshStatus />);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();
      expect(screen.getByText("Portfolio up to date")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-checkmark")).toBeTruthy();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
    });

    it("should hide after the visibility duration elapses", () => {
      mockSync("syncing", true);
      const { rerender } = render(<PortfolioRefreshStatus />);

      mockSync("synced");
      rerender(<PortfolioRefreshStatus />);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(REFRESH_STATUS_VISIBLE_DURATION_MS);
      });

      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });
});
