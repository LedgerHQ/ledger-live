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
    withDelay: (_delay: number, animation: unknown) => animation,
    withSpring: (toValue: unknown) => toValue,
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
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { UP_TO_DATE_VISIBLE_DURATION_MS } from "../usePortfolioRefreshStatusViewModel";
import { PortfolioRefreshStatus } from "../index";
import { setRefreshCompleted } from "~/reducers/portfolioRefresh";
import { State } from "~/reducers/types";

const FIXED_NOW = new Date("2025-08-15T12:00:00Z").getTime();

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeAccount = (lastSyncDate: Date) => ({
  ...genAccount("test-sync-account"),
  lastSyncDate,
});

const withRefreshing = (): ((state: State) => State) => state => ({
  ...state,
  portfolioRefresh: { isRefreshing: true, lastSyncTimestampSnapshot: null },
});

const withIdle =
  (lastSyncDate: Date): ((state: State) => State) =>
  state => ({
    ...state,
    accounts: {
      ...state.accounts,
      active: [makeAccount(lastSyncDate)],
    },
    portfolioRefresh: { isRefreshing: false, lastSyncTimestampSnapshot: null },
  });

const renderRefreshing = () =>
  render(<PortfolioRefreshStatus />, {
    overrideInitialState: withRefreshing(),
  });

const completeRefresh = (store: ReturnType<typeof renderRefreshing>["store"]) =>
  act(() => {
    store.dispatch(setRefreshCompleted());
  });

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PortfolioRefreshStatus", () => {
  beforeEach(() => {
    jest.setSystemTime(FIXED_NOW);
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

  describe("up-to-date state", () => {
    it("should show checkmark and 'You're up to date' without spinner right after refresh completes", () => {
      const { store } = renderRefreshing();
      completeRefresh(store);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();
      expect(screen.getByText("You're up to date")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-checkmark")).toBeTruthy();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
    });

    it("should hide after the visibility duration elapses", () => {
      const { store } = renderRefreshing();
      completeRefresh(store);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(UP_TO_DATE_VISIBLE_DURATION_MS);
      });

      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });
});
