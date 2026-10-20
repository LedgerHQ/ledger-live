import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: jest.fn(() => null),
}));

jest.mock("~/renderer/screens/account", () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-account-page" />,
}));

const mockSyncOneAccountOnMount = jest.mocked(SyncOneAccountOnMount);

const btcAccount = genAccount("account-detail-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 1,
});
const ethAccount = genAccount("account-detail-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 1,
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const ethAccountWithToken: Account = { ...ethAccount, subAccounts: [usdcAccount] };

const CurrentPath = () => <div data-testid="current-path">{useLocation().pathname}</div>;

function renderAccountRoute(
  route: string,
  accountDetail: { enabled: boolean; params?: { excludedCurrencyIds: string[] } },
) {
  return render(
    <>
      <Routes>
        <Route path="/account/:parentId/:id/*" element={<AccountDetailRoute />} />
        <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      </Routes>
      <CurrentPath />
    </>,
    {
      initialRoute: route,
      initialState: {
        ...withFlagOverrides({ accountDetail }),
        accounts: [btcAccount, ethAccountWithToken],
      },
    },
  );
}

describe("AccountDetail routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the new page and syncs the account when the flag is on", async () => {
    renderAccountRoute(getAccountUrl(btcAccount.id), { enabled: true });

    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
    expect(screen.getByTestId("account-detail-hero")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy-account-page")).not.toBeInTheDocument();
    expect(mockSyncOneAccountOnMount).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "view-account", priority: 10, accountId: btcAccount.id }),
      undefined,
    );
  });

  it("renders the legacy page when the flag is off", async () => {
    renderAccountRoute(getAccountUrl(btcAccount.id), { enabled: false });

    expect(await screen.findByTestId("legacy-account-page")).toBeInTheDocument();
    expect(screen.queryByTestId("account-detail-layout")).not.toBeInTheDocument();
  });

  it("renders the legacy page for an excluded currency only", async () => {
    const accountDetail = { enabled: true, params: { excludedCurrencyIds: ["bitcoin"] } };

    renderAccountRoute(getAccountUrl(btcAccount.id), accountDetail);
    expect(await screen.findByTestId("legacy-account-page")).toBeInTheDocument();
  });

  it("renders the new page for a currency that is not excluded", async () => {
    const accountDetail = { enabled: true, params: { excludedCurrencyIds: ["bitcoin"] } };

    renderAccountRoute(getAccountUrl(ethAccountWithToken.id), accountDetail);
    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
  });

  it("redirects a token sub-account to its parent account when the flag is on", async () => {
    renderAccountRoute(getAccountUrl(usdcAccount.id, ethAccountWithToken.id), { enabled: true });

    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      getAccountUrl(ethAccountWithToken.id),
    );
  });

  it("keeps the token sub-account on the legacy page when the flag is off", async () => {
    const tokenUrl = getAccountUrl(usdcAccount.id, ethAccountWithToken.id);

    renderAccountRoute(tokenUrl, { enabled: false });

    expect(await screen.findByTestId("legacy-account-page")).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent(tokenUrl);
  });
});
