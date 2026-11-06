import React from "react";
import BigNumber from "bignumber.js";
import { MemoryRouter, Route, Routes } from "react-router";
import { parseAnyAccountId } from "@domain/entity-account";
import { CounterValuesStateRawSchema } from "@domain/entity-market-countervalues";
import { act, render, screen, waitFor, within, withFlagOverrides } from "tests/testSetup";
import { mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { setSelectedTimeRange } from "~/renderer/actions/settings";
import { getAccountUrl } from "~/renderer/utils";
import { AccountAnalyticsScreen } from "../screens/AccountAnalytics";
import {
  createAnalyticsAccount,
  createAnalyticsCountervalues,
  createAnalyticsToken,
} from "../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-integration-eth");
const token = createAnalyticsToken(eth);
const parent = { ...eth, subAccounts: [token] };
const btc = createAnalyticsAccount("analytics-integration-btc", "bitcoin");

function renderAnalytics({ fromCard = false, zeroNative = false, missingTokenPrice = false } = {}) {
  const sourceParent = { ...parent, subAccounts: [token] };
  const sourceAccount = zeroNative
    ? {
        ...sourceParent,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        operations: [],
      }
    : sourceParent;
  const rates = createAnalyticsCountervalues(
    missingTokenPrice ? [sourceAccount, btc] : [sourceAccount, token, btc],
  );
  const initialCountervalues = CounterValuesStateRawSchema.parse({
    ...Object.fromEntries(
      Object.entries(rates.data).map(([key, map]) => [key, Object.fromEntries(map)]),
    ),
    status: rates.status,
  });
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/analytics",
          state: fromCard
            ? {
                accountAnalytics: {
                  accountId: parent.id,
                  currencyId: "ethereum",
                  metric: "balance",
                  backPath: "/untrusted",
                },
              }
            : undefined,
        },
      ]}
    >
      <Routes>
        <Route path="/analytics" element={<AccountAnalyticsScreen />} />
        <Route path={getAccountUrl(parent.id)} element={<p>Source account</p>} />
        <Route path="/" element={<p>Portfolio destination</p>} />
      </Routes>
    </MemoryRouter>,
    {
      skipRouter: true,
      initialCountervalues,
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [sourceAccount, btc],
        settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD", selectedTimeRange: "month" },
        wallet: {
          accountNames: new Map([
            [parseAnyAccountId(parent.id), "Ethereum 1"],
            [parseAnyAccountId(btc.id), "Bitcoin 1"],
          ]),
          starredAccountIds: new Set(),
          walletSync: { walletSyncState: { data: null, version: 0 } },
        },
      },
    },
  );
}

describe("Account Analytics desktop integration", () => {
  beforeEach(() => mockLumenChartResizeObserver());

  it("should retain asset/account, current balance and open PnL details when the chart period changes", async () => {
    const { user, store } = renderAnalytics({ fromCard: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum"),
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1");
    await waitFor(() =>
      expect(screen.getByTestId("analytics-balance-amount")).toHaveAccessibleName("$ 200.00"),
    );
    const amount = screen.getByTestId("analytics-balance-amount").getAttribute("aria-label");
    const cards = screen.getByTestId("analytics-pnl").textContent;
    await user.click(screen.getByText("Details", { exact: true }));
    const details = await screen.findByTestId("pnl-detail-dialog");
    const detailText = details.textContent;
    act(() => {
      store.dispatch(setSelectedTimeRange("day"));
    });
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum");
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1");
    expect(screen.getByTestId("analytics-balance-amount").getAttribute("aria-label")).toBe(amount);
    expect(screen.getByTestId("analytics-pnl").textContent).toBe(cards);
    expect(screen.getByTestId("pnl-detail-dialog")).toBe(details);
    expect(details.textContent).toBe(detailText);
    expect(screen.queryByTestId("analytics-pnl-skeleton")).not.toBeInTheDocument();
  });

  it("should retain the range, reset an incompatible account and clear the account when All assets is selected", async () => {
    const { user, store } = renderAnalytics({ fromCard: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum"),
    );
    await user.click(screen.getByTestId("analytics-asset-filter"));
    expect(screen.queryByPlaceholderText("Search assets")).not.toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Bitcoin" })).toBeVisible();
    await user.keyboard("{Home}{ArrowDown}{Enter}");
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Bitcoin"),
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("All accounts");
    expect(store.getState().settings.selectedTimeRange).toBe("month");
    await user.click(screen.getByTestId("analytics-account-filter"));
    expect(await screen.findByRole("option", { name: "Bitcoin 1 (Bitcoin)" })).toBeVisible();
    expect(screen.queryByPlaceholderText("Search accounts")).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Ethereum 1/ })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByTestId("analytics-asset-filter"));
    await waitFor(() => expect(screen.getByRole("listbox")).toHaveFocus());
    await user.keyboard("{Home}{Enter}");
    await waitFor(() =>
      expect(screen.queryByTestId("analytics-account-filter")).not.toBeInTheDocument(),
    );
  });

  it("should change only the selected holding while retaining every asset in the asset list", async () => {
    const { user } = renderAnalytics({ fromCard: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum"),
    );
    await user.click(screen.getByTestId("analytics-asset-filter"));
    expect(await screen.findByRole("option", { name: "USD Coin" })).toBeVisible();
    await user.keyboard("{End}{Enter}");
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1");
    await waitFor(() =>
      expect(screen.getByTestId("analytics-balance-amount")).toHaveAccessibleName("$ 10.00"),
    );
    expect(within(screen.getByTestId("analytics-pnl")).getByText("Profit and loss")).toBeVisible();
    await user.click(screen.getByTestId("analytics-asset-filter"));
    expect(await screen.findByRole("option", { name: "Bitcoin" })).toBeVisible();
  });

  it("should return from a card entry to the canonical source account", async () => {
    const { user } = renderAnalytics({ fromCard: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1"),
    );
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Source account")).toBeVisible();
  });

  it("should preserve keyboard focus and filter controls when the chart range changes", async () => {
    const { user } = renderAnalytics({ fromCard: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1"),
    );
    const assetFilter = screen.getByTestId("analytics-asset-filter");
    const accountFilter = screen.getByTestId("analytics-account-filter");
    const range = screen.getByTestId("line-chart-range-1d");
    await user.click(range);
    expect(range).toHaveFocus();
    expect(screen.getByTestId("analytics-asset-filter")).toBe(assetFilter);
    expect(screen.getByTestId("analytics-account-filter")).toBe(accountFilter);
    expect(accountFilter).toHaveTextContent("Ethereum 1");
  });

  it("should preserve a zero native card entry backed by confirmed token activity", async () => {
    renderAnalytics({ fromCard: true, zeroNative: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum"),
    );
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Ethereum 1");
    expect(screen.getByTestId("analytics-balance-amount")).toHaveAccessibleName("$ 0.00");
  });

  it("should start a normal visit with All assets and no account control", async () => {
    renderAnalytics();
    await waitFor(() => expect(screen.getByTestId("analytics-asset-filter")).toBeEnabled());
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("All assets");
    expect(screen.queryByTestId("analytics-account-filter")).not.toBeInTheDocument();
  });

  it("should show the priced total and chart for All assets when a held asset has no price", async () => {
    renderAnalytics({ missingTokenPrice: true });
    await waitFor(() => expect(screen.getByTestId("analytics-asset-filter")).toBeEnabled());
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("All assets");
    await waitFor(() =>
      expect(screen.getByTestId("analytics-balance-amount")).toHaveAccessibleName("$ 400.00"),
    );
    expect(screen.queryByText("Data is not available for this selection.")).not.toBeInTheDocument();
  });

  it("should report unavailable data without Retry when the selected asset has no price", async () => {
    const { user } = renderAnalytics({ fromCard: true, missingTokenPrice: true });
    await waitFor(() =>
      expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum"),
    );
    await user.click(screen.getByTestId("analytics-asset-filter"));
    expect(await screen.findByRole("option", { name: "USD Coin" })).toBeVisible();
    await user.keyboard("{End}{Enter}");
    expect(
      (await screen.findAllByText("Data is not available for this selection.")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-balance-amount")).not.toBeInTheDocument();
  });
});
