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
import { MINUTE_MS, HOUR_MS, DAY_MS } from "@ledgerhq/live-common/utils/timeAgo";
import { UP_TO_DATE_VISIBLE_DURATION_MS } from "../usePortfolioRefreshStatusViewModel";
import { PortfolioRefreshStatus } from "../index";
import { setRefreshStarted, setRefreshCompleted } from "~/reducers/portfolioRefresh";
import { AccountsActionTypes } from "~/actions/types";
import { State } from "~/reducers/types";

const FIXED_NOW = new Date("2025-08-15T12:00:00Z").getTime();
const TEST_LOCALE = "en";

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeAccount = (lastSyncDate: Date) => ({
  ...genAccount("test-sync-account"),
  lastSyncDate,
});

const withRefreshing =
  (snapshotTimestamp: number | null = null): ((state: State) => State) =>
  state => ({
    ...state,
    portfolioRefresh: { isRefreshing: true, lastSyncTimestampSnapshot: snapshotTimestamp },
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

const renderRefreshing = (snapshotTimestamp: number | null = null) =>
  render(<PortfolioRefreshStatus />, {
    overrideInitialState: withRefreshing(snapshotTimestamp),
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
    it("should show spinner and 'Refreshing...' when no snapshot timestamp", () => {
      renderRefreshing();
      expect(screen.getByTestId("portfolio-refresh-status-spinner")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-refreshing")).toBeVisible();
      expect(screen.getByText("Refreshing...")).toBeVisible();
    });

    it("should show 'Refreshing...' when snapshot is < 1 minute ago", () => {
      renderRefreshing(Date.now() - 30_000);
      expect(screen.getByText("Refreshing...")).toBeVisible();
    });

    it("should show relative time for a snapshot < 1 hour ago", () => {
      renderRefreshing(Date.now() - 3 * MINUTE_MS);
      const expected = new Intl.RelativeTimeFormat(TEST_LOCALE, { numeric: "always" }).format(
        -3,
        "minute",
      );
      expect(screen.getByText(`Refreshing - Last update ${expected}`)).toBeVisible();
    });

    it("should show relative time for a snapshot < 24 hours ago", () => {
      renderRefreshing(Date.now() - 2 * HOUR_MS);
      const expected = new Intl.RelativeTimeFormat(TEST_LOCALE, { numeric: "always" }).format(
        -2,
        "hour",
      );
      expect(screen.getByText(`Refreshing - Last update ${expected}`)).toBeVisible();
    });

    it("should show relative time for a snapshot < 7 days ago", () => {
      renderRefreshing(Date.now() - 3 * DAY_MS);
      const expected = new Intl.RelativeTimeFormat(TEST_LOCALE, { numeric: "always" }).format(
        -3,
        "day",
      );
      expect(screen.getByText(`Refreshing - Last update ${expected}`)).toBeVisible();
    });

    it("should show absolute date without year for a snapshot >= 7 days ago in the same year", () => {
      const lastSyncDate = new Date(2025, 0, 12);
      renderRefreshing(lastSyncDate.getTime());
      const label = screen.getByTestId("portfolio-refresh-status-refreshing");
      expect(label).toBeVisible();
      const expected = new Intl.DateTimeFormat(TEST_LOCALE, {
        day: "numeric",
        month: "short",
      }).format(lastSyncDate);
      expect(label.props.children).toContain(expected);
    });

    it("should show absolute date with year for a snapshot in a previous year", () => {
      const lastSyncDate = new Date(2024, 0, 12);
      renderRefreshing(lastSyncDate.getTime());
      const label = screen.getByTestId("portfolio-refresh-status-refreshing");
      expect(label).toBeVisible();
      const expected = new Intl.DateTimeFormat(TEST_LOCALE, {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }).format(lastSyncDate);
      expect(label.props.children).toContain(expected);
    });
  });

  describe("snapshot stability during refresh", () => {
    it("should keep showing the snapshot timestamp even when accounts sync mid-refresh", () => {
      const oldSyncDate = new Date(Date.now() - 3 * MINUTE_MS);
      const { store } = render(<PortfolioRefreshStatus />, {
        overrideInitialState: withIdle(oldSyncDate),
      });

      const expectedLabel = new Intl.RelativeTimeFormat(TEST_LOCALE, {
        numeric: "always",
      }).format(-3, "minute");

      act(() => {
        store.dispatch(setRefreshStarted(oldSyncDate.getTime()));
      });

      expect(screen.getByText(`Refreshing - Last update ${expectedLabel}`)).toBeVisible();

      act(() => {
        store.dispatch({
          type: AccountsActionTypes.SET_ACCOUNTS,
          payload: [makeAccount(new Date())],
        });
      });

      expect(screen.getByText(`Refreshing - Last update ${expectedLabel}`)).toBeVisible();
    });

    it("should show 'Refreshing...' when snapshot is < 1 minute old", () => {
      renderRefreshing(Date.now() - 30_000);
      expect(screen.getByText("Refreshing...")).toBeVisible();
    });
  });

  describe("up-to-date state", () => {
    it("should show 'You're up to date' without spinner right after refresh completes", () => {
      const { store } = renderRefreshing();
      completeRefresh(store);

      expect(screen.getByTestId("portfolio-refresh-status-up-to-date")).toBeVisible();
      expect(screen.getByText("You're up to date")).toBeVisible();
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
