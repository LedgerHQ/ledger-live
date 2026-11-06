import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import type { Account } from "@ledgerhq/types-live";
import { setSelectedTimeRange } from "~/actions/settings";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { TestNavigatorWrapper } from "./shared";
import {
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../__fixtures__/accountAnalyticsFixtures";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

const eth = createAnalyticsAccount("analytics-mobile-eth");
const usdc = createAnalyticsToken(eth);
const ethWithUsdc: Account = { ...eth, subAccounts: [usdc] };
const btc = createAnalyticsAccount("analytics-mobile-btc", "bitcoin");
const BTC_ASSET = "asset:bitcoin";

type Setup = Readonly<{
  enabled?: boolean;
  priced?: readonly Parameters<typeof createAnalyticsCountervalues>[0][number][];
}>;

function withAnalytics({ enabled = true, priced = [eth, usdc, btc] }: Setup = {}) {
  return (state: State): State =>
    withFlagOverrides({ accountDetail: { enabled } })({
      ...state,
      accounts: { ...state.accounts, active: [ethWithUsdc, btc] },
      settings: { ...state.settings, selectedTimeRange: "month" },
      countervalues: { ...state.countervalues, rates: createAnalyticsCountervalues(priced) },
    });
}

function renderAnalytics(params?: Record<string, unknown>, setup?: Setup) {
  return render(<TestNavigatorWrapper />, {
    overrideInitialState: withAnalytics(setup),
    navigationInitialState: { routes: [{ name: ScreenName.Analytics, params }] },
  });
}

const cardEntry = {
  accountAnalytics: { accountId: eth.id, currencyId: "ethereum", metric: "balance" },
};

describe("Account Analytics (mobile)", () => {
  it("should scope the chart and the PnL to the account of the card entry", async () => {
    renderAnalytics(cardEntry);

    expect(await screen.findByTestId("analytics-account-filter")).toBeVisible();
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent(/Ethereum/);
    expect(await screen.findByTestId("analytics-pnl-section")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
  });

  it("should keep the filters and the PnL when the range changes", async () => {
    const { store } = renderAnalytics(cardEntry);
    expect(await screen.findByTestId("analytics-account-filter")).toBeVisible();
    const pnl = await screen.findByTestId("analytics-pnl-section");

    act(() => {
      store.dispatch(setSelectedTimeRange("day"));
    });

    expect(screen.getByTestId("analytics-account-filter")).toBeVisible();
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent(/Ethereum/);
    expect(screen.getByTestId("analytics-pnl-section")).toBe(pnl);
    expect(screen.queryByTestId("analytics-pnl-skeleton")).toBeNull();
  });

  it("should reset the account and keep the range when another asset is picked", async () => {
    const { store, user } = renderAnalytics(cardEntry);
    expect(await screen.findByTestId("analytics-account-filter")).toBeVisible();
    await user.press(screen.getByTestId("analytics-asset-filter"));
    await user.press(await screen.findByTestId(`analytics-asset-filter-option-${BTC_ASSET}`));

    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent(/Bitcoin/),
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent(/All accounts/);
    expect(store.getState().settings.selectedTimeRange).toBe("month");
  });

  it("should show every asset without an account filter on a normal visit", async () => {
    renderAnalytics();
    expect(await screen.findByTestId("analytics-asset-filter")).toHaveTextContent(/All assets/);
    expect(screen.queryByTestId("analytics-account-filter")).toBeNull();
  });

  it("should never write the scoped balance into the Portfolio balance", async () => {
    const { store } = renderAnalytics(cardEntry);
    const portfolioBalance = store.getState().portfolioBalanceDisplay;
    expect(await screen.findByTestId("analytics-pnl-section")).toBeVisible();
    act(() => {
      store.dispatch(setSelectedTimeRange("day"));
    });
    expect(store.getState().portfolioBalanceDisplay).toEqual(portfolioBalance);
  });

  it("should report unavailable data without Retry when the held asset has no price", async () => {
    renderAnalytics(
      { accountAnalytics: { accountId: btc.id, currencyId: "bitcoin", metric: "balance" } },
      { priced: [eth, usdc] },
    );
    expect(
      (await screen.findAllByText("Data is not available for this selection.")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("should retry the asset metadata after a failure", async () => {
    let calls = 0;
    server.use(
      http.get("*/v1/assets", () => {
        calls += 1;
        return calls === 1 ? HttpResponse.error() : undefined;
      }),
    );
    const { user } = renderAnalytics(cardEntry);
    const [retry] = await screen.findAllByText("Retry");
    await user.press(retry);
    expect(await screen.findByTestId("analytics-account-filter")).toBeVisible();
    expect(calls).toBeGreaterThan(1);
  });

  it("should keep the Portfolio-wide screen when the flag is off", async () => {
    renderAnalytics(cardEntry, { enabled: false });
    expect(await screen.findByTestId("analytics-chart-section")).toBeVisible();
    expect(screen.queryByTestId("account-analytics")).toBeNull();
  });
});
