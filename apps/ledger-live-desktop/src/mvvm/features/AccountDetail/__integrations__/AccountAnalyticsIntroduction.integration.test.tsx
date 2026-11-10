import React from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import { AnalyticsIntroduction } from "../components/AnalyticsIntroduction";

const generated = genAccount("analytics-introduction-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});
const historical: Account = {
  ...generated,
  blockHeight: 10000,
  operations: generated.operations.map(operation => ({ ...operation, blockHeight: 80 })),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
};
const otherAccount = genAccount("analytics-introduction-other-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});

function DestinationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Analytics entry context">{JSON.stringify(location.state)}</output>
      <button onClick={() => navigate(-1)}>Return to account</button>
    </>
  );
}

type IntroductionSetup = Readonly<{
  hasDismissed?: boolean;
  analyticsBanner?: boolean;
}>;

function renderIntroduction(
  account = historical,
  { hasDismissed = false, analyticsBanner = true }: IntroductionSetup = {},
) {
  return render(
    <>
      <Routes>
        <Route
          path={getAccountUrl(account.id)}
          element={<AnalyticsIntroduction account={account} />}
        />
        <Route
          path={getAccountUrl(otherAccount.id)}
          element={<AnalyticsIntroduction account={otherAccount} />}
        />
        <Route path="/analytics" element={<DestinationProbe />} />
      </Routes>
      <Link to={getAccountUrl(otherAccount.id)}>Open another account</Link>
    </>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true, params: { analyticsBanner } } }),
        accounts: [account, otherAccount],
        accountAnalyticsIntroduction: { hasDismissed },
      },
    },
  );
}

describe("Account Analytics introduction desktop integration", () => {
  it("should show the approved copy for a zero-balance account with confirmed history", () => {
    const { store } = renderIntroduction();

    expect(screen.getByText("Looking for your account performance?")).toBeVisible();
    expect(
      screen.getByText("All your performance data now lives on the Analytics page."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to Analytics" })).toBeVisible();
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });

  it("should hide the introduction on every account after closing it with the keyboard", async () => {
    const { user, store } = renderIntroduction();
    const dismiss = screen.getByRole("button", { name: "Dismiss Analytics introduction" });
    await user.tab();
    await user.tab();
    expect(dismiss).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("link", { name: "Open another account" }));

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
  });

  it("should send native asset and account context and keep the introduction until it is closed", async () => {
    const { user, store } = renderIntroduction();

    await user.click(screen.getByRole("button", { name: "Go to Analytics" }));

    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
    expect(screen.getByLabelText("Analytics entry context")).toHaveTextContent(
      JSON.stringify({
        accountAnalytics: {
          accountId: historical.id,
          currencyId: "ethereum",
          metric: "balance",
          backPath: getAccountUrl(historical.id),
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Return to account" }));
    expect(screen.getByRole("button", { name: "Go to Analytics" })).toBeVisible();
  });

  it("should stay hidden when the analyticsBanner param is off", () => {
    renderIntroduction(historical, { analyticsBanner: false });

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
  });

  it("should remain hidden when a prior installation dismissal is restored", () => {
    renderIntroduction(historical, { hasDismissed: true });

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
  });

  it("should keep a pending-only account unconsumed even when the explorer reports an operation", () => {
    const pendingOnly: Account = {
      ...historical,
      operations: historical.operations.map(operation => ({ ...operation, blockHeight: null })),
      pendingOperations: historical.operations,
      operationsCount: 1,
    };
    const { store } = renderIntroduction(pendingOnly);

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });

  it("should exclude an account without any history", () => {
    renderIntroduction({
      ...historical,
      operations: [],
      pendingOperations: [],
      operationsCount: 0,
    });

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
  });

  it("should wait for the existing currency confirmation threshold", () => {
    renderIntroduction({
      ...historical,
      operations: historical.operations.map(operation => ({ ...operation, blockHeight: 10000 })),
    });

    expect(screen.queryByRole("button", { name: "Go to Analytics" })).toBeNull();
  });

  it("should include a parent whose only confirmed history is on a token account", () => {
    const token = genTokenAccount(0, historical, usdcToken);
    const account: Account = {
      ...historical,
      operations: [],
      operationsCount: 0,
      subAccounts: [{ ...token, operations: historical.operations }],
    };
    renderIntroduction(account);

    expect(screen.getByRole("button", { name: "Go to Analytics" })).toBeVisible();
  });
});
