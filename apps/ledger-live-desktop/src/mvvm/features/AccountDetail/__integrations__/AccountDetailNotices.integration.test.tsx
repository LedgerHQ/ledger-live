import React from "react";
import { Route, Routes } from "react-router";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: () => false,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const NOTICES = "account-detail-notices";
const HERO = "account-detail-hero";

const notice = (id: string) => {
  return `${NOTICES}-${id}`;
};

const accountOf = (currencyId: string): Account => {
  return genAccount(`account-detail-notices-${currencyId}`, {
    currency: getCryptoCurrencyById(currencyId),
    operationsSize: 2,
    subAccountsCount: 0,
  });
};

const renderAccount = (account: Account, flags: Record<string, { enabled: boolean }> = {}) => {
  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      <Route path="/perps" element={<div data-testid="perps-page" />} />
    </Routes>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true }, ...flags }),
        accounts: [account],
      },
    },
  );
};

describe("AccountDetail notices", () => {
  it("shows the Robinhood disclaimer on a Robinhood chain account", async () => {
    renderAccount(accountOf("robinhood"), { llRobinhoodDisclaimer: { enabled: true } });

    expect(await screen.findByTestId(notice("robinhoodDisclaimer"))).toBeVisible();
    expect(
      screen.getByText("Total balance does not include dividends or stock splits."),
    ).toBeVisible();
  });

  it("does not show the Robinhood disclaimer on other accounts", async () => {
    renderAccount(accountOf("ethereum"), { llRobinhoodDisclaimer: { enabled: true } });

    expect(await screen.findByTestId(HERO)).toBeVisible();
    expect(screen.queryByTestId(notice("robinhoodDisclaimer"))).toBeNull();
  });

  it("opens Perps from a Hyperliquid account", async () => {
    const { user } = renderAccount(accountOf("hypercore"), { ptxPerpsLiveApp: { enabled: true } });

    await user.click(await screen.findByTestId(`${notice("perps")}-action`));

    expect(await screen.findByTestId("perps-page")).toBeVisible();
  });

  it("does not offer Perps when the Perps flag is off", async () => {
    renderAccount(accountOf("hypercore"), { ptxPerpsLiveApp: { enabled: false } });

    expect(await screen.findByTestId(HERO)).toBeVisible();
    expect(screen.queryByTestId(notice("perps"))).toBeNull();
  });
});
