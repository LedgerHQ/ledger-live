import React from "react";
import { render, screen, act } from "@tests/test-renderer";
import { MINUTE_MS } from "@ledgerhq/live-common/utils/timeAgo";
import { UP_TO_DATE_VISIBLE_DURATION_MS } from "../usePortfolioRefreshStatusViewModel";
import { PortfolioRefreshStatus } from "../index";
import { State } from "~/reducers/types";

const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// ─── Helpers ────────────────────────────────────────────────────────────────

const withRefreshing =
  (lastRefreshTimestamp: number | null = null): ((state: State) => State) =>
  state => ({
    ...state,
    portfolioRefresh: { isRefreshing: true, lastRefreshTimestamp },
  });

const withCompleted =
  (lastRefreshTimestamp: number): ((state: State) => State) =>
  state => ({
    ...state,
    portfolioRefresh: { isRefreshing: false, lastRefreshTimestamp },
  });

const renderRefreshing = (lastRefreshTimestamp: number | null = null) =>
  render(<PortfolioRefreshStatus />, {
    overrideInitialState: withRefreshing(lastRefreshTimestamp),
  });

const completeRefresh = (store: ReturnType<typeof renderRefreshing>["store"]) =>
  act(() => {
    store.dispatch({ type: "portfolioRefresh/setRefreshCompleted", payload: Date.now() });
  });

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("PortfolioRefreshStatus", () => {
  describe("idle state", () => {
    it("should render the container but show no content", () => {
      render(<PortfolioRefreshStatus />);
      expect(screen.getByTestId("portfolio-refresh-status")).toBeVisible();
      expect(screen.queryByTestId("portfolio-refresh-status-spinner")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-refreshing")).toBeNull();
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });

    it("should not show up-to-date when mounted with a completed timestamp but no prior refresh", () => {
      render(<PortfolioRefreshStatus />, {
        overrideInitialState: withCompleted(Date.now() - 30_000),
      });
      expect(screen.queryByTestId("portfolio-refresh-status-up-to-date")).toBeNull();
    });
  });

  describe("refreshing state", () => {
    it("should show spinner and 'Refreshing...' when no previous timestamp", () => {
      renderRefreshing();
      expect(screen.getByTestId("portfolio-refresh-status-spinner")).toBeVisible();
      expect(screen.getByTestId("portfolio-refresh-status-refreshing")).toBeVisible();
      expect(screen.getByText("Refreshing...")).toBeVisible();
    });

    it("should show 'just now' for a timestamp < 1 minute ago", () => {
      renderRefreshing(Date.now() - 30_000);
      expect(screen.getByText("Refreshing - Last update just now")).toBeVisible();
    });

    it("should show 'Xm ago' for a timestamp < 1 hour ago", () => {
      renderRefreshing(Date.now() - 3 * MINUTE_MS);
      expect(screen.getByText("Refreshing - Last update 3m ago")).toBeVisible();
    });

    it("should show 'Xh ago' for a timestamp < 24 hours ago", () => {
      renderRefreshing(Date.now() - 2 * HOUR_MS);
      expect(screen.getByText("Refreshing - Last update 2h ago")).toBeVisible();
    });

    it("should show 'X days ago' for a timestamp < 7 days ago", () => {
      renderRefreshing(Date.now() - 3 * DAY_MS);
      expect(screen.getByText("Refreshing - Last update 3d ago")).toBeVisible();
    });

    it("should show absolute date without year for a timestamp >= 7 days ago in the same year", () => {
      renderRefreshing(new Date(new Date().getFullYear(), 0, 12).getTime());
      const label = screen.getByTestId("portfolio-refresh-status-refreshing");
      expect(label).toBeVisible();
      expect(label.props.children).toMatch(/Jan/);
    });

    it("should show absolute date with year for a timestamp in a previous year", () => {
      renderRefreshing(new Date(new Date().getFullYear() - 1, 0, 12).getTime());
      const label = screen.getByTestId("portfolio-refresh-status-refreshing");
      expect(label).toBeVisible();
      expect(label.props.children).toMatch(/Jan/);
      expect(label.props.children).toMatch(/\d{2}$/);
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

  describe("label update over time", () => {
    it("should update label from 'just now' to '1m ago' after one minute", () => {
      renderRefreshing(Date.now() - 30_000);

      expect(screen.getByText("Refreshing - Last update just now")).toBeVisible();

      act(() => {
        jest.advanceTimersByTime(MINUTE_MS);
      });

      expect(screen.getByText("Refreshing - Last update 1m ago")).toBeVisible();
    });
  });
});
