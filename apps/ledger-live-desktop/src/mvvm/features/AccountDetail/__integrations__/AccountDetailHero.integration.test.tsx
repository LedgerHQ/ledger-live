import React from "react";
import { BigNumber } from "bignumber.js";
import { Route, Routes, useLocation } from "react-router";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getModalData } from "~/renderer/reducers/modals";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: [] }),
}));

const mockGetCanStakeCurrency = jest.fn().mockReturnValue(false);

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: mockGetCanStakeCurrency,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const HERO = "account-detail-hero";
const ACTIONS = `${HERO}-actions`;

const funded = (account: Account, amount: number): Account => ({
  ...account,
  balance: new BigNumber(amount),
  spendableBalance: new BigNumber(amount),
});

const btcAccount = funded(
  genAccount("account-detail-hero-btc", {
    currency: getCryptoCurrencyById("bitcoin"),
    operationsSize: 1,
  }),
  100000,
);

const ethAccount = funded(
  genAccount("account-detail-hero-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  }),
  100000,
);
const usdcAccount = {
  ...genTokenAccount(0, ethAccount, usdcToken),
  balance: new BigNumber(500),
  spendableBalance: new BigNumber(500),
};
const ethAccountWithToken: Account = { ...ethAccount, subAccounts: [usdcAccount] };

const CurrentLocation = () => {
  const { pathname, state } = useLocation();
  return <div data-testid="current-location">{JSON.stringify({ pathname, state })}</div>;
};

function mockRamp(onRamp: string[], offRamp: string[]) {
  jest.mocked(useRampCatalog).mockReturnValue({
    isCurrencyAvailable: () => true,
    getSupportedCryptoCurrencyIds: (kind: "onRamp" | "offRamp") =>
      kind === "onRamp" ? onRamp : offRamp,
  } as unknown as ReturnType<typeof useRampCatalog>);
}

function renderHero(account: Account) {
  return render(
    <>
      <Routes>
        <Route path="/account/:id/*" element={<AccountDetailRoute />} />
        <Route path="/exchange" element={null} />
      </Routes>
      <CurrentLocation />
    </>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [account],
      },
    },
  );
}

const actionIds = () =>
  Array.from(screen.getByTestId(ACTIONS).querySelectorAll<HTMLElement>("[data-testid]"), element =>
    element.dataset.testid?.replace(`${ACTIONS}-`, ""),
  );

describe("AccountDetail hero", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCanStakeCurrency.mockReturnValue(false);
    mockRamp([], []);
  });

  it("shows only Receive and Send when nothing else is supported", async () => {
    renderHero(btcAccount);

    expect(await screen.findByTestId(ACTIONS)).toBeVisible();
    expect(actionIds()).toEqual(["receive", "send"]);
    expect(screen.getByTestId(`${ACTIONS}-send`)).toBeEnabled();
  });

  it("shows Buy, Sell and Earn when the asset supports them", async () => {
    mockRamp(["bitcoin"], ["bitcoin"]);
    mockGetCanStakeCurrency.mockReturnValue(true);
    renderHero(btcAccount);

    expect(await screen.findByTestId(ACTIONS)).toBeVisible();
    expect(actionIds()).toEqual(["receive", "send", "buy", "sell", "earn"]);
    expect(screen.getByTestId(`${ACTIONS}-sell`)).toBeEnabled();
  });

  it("disables Send, Sell and Earn without funds", async () => {
    mockRamp(["bitcoin"], ["bitcoin"]);
    mockGetCanStakeCurrency.mockReturnValue(true);
    renderHero(funded(btcAccount, 0));

    expect(await screen.findByTestId(ACTIONS)).toBeVisible();
    expect(screen.getByTestId(`${ACTIONS}-send`)).toBeDisabled();
    expect(screen.getByTestId(`${ACTIONS}-sell`)).toBeDisabled();
    expect(screen.getByTestId(`${ACTIONS}-earn`)).toBeDisabled();
    expect(screen.getByTestId(`${ACTIONS}-buy`)).toBeEnabled();
  });

  it("shows a $0 balance when every asset of the account is empty", async () => {
    renderHero(funded(btcAccount, 0));

    expect(await screen.findByTestId(`${HERO}-balance`)).toBeVisible();
  });

  it("does not show a $0 balance when a funded token has no quote", async () => {
    renderHero({ ...funded(ethAccountWithToken, 0), subAccounts: [usdcAccount] });

    expect(await screen.findByTestId(ACTIONS)).toBeVisible();
    expect(screen.queryByTestId(`${HERO}-balance`)).toBeNull();
  });

  it("lets the user pick which funded asset of the account to send", async () => {
    const { user } = renderHero(ethAccountWithToken);

    await user.click(await screen.findByTestId(`${ACTIONS}-send`));

    const picker = await screen.findByTestId("account-detail-asset-picker");
    expect(within(picker).getByTestId("account-detail-asset-picker-ethereum")).toBeVisible();
    expect(
      within(picker).getByTestId(`account-detail-asset-picker-${usdcToken.id}`),
    ).toHaveTextContent("USDC");
  });

  it("lists the account's sellable assets in the picker, even without balance", async () => {
    mockRamp([], ["ethereum", usdcToken.id]);
    const emptyUsdc = {
      ...usdcAccount,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    };
    const { user } = renderHero({ ...ethAccountWithToken, subAccounts: [emptyUsdc] });

    await user.click(await screen.findByTestId(`${ACTIONS}-sell`));

    const picker = await screen.findByTestId("account-detail-asset-picker");
    expect(within(picker).getByTestId("account-detail-asset-picker-ethereum")).toBeVisible();
    expect(within(picker).getByTestId(`account-detail-asset-picker-${usdcToken.id}`)).toBeVisible();
  });

  it("opens the buy picker on the account network for the buy use case", async () => {
    mockRamp(["bitcoin"], []);
    const { user, store } = renderHero(btcAccount);

    await user.click(await screen.findByTestId(`${ACTIONS}-buy`));

    expect(store.getState().modularDialog.dialogParams).toEqual(
      expect.objectContaining({ networkIds: ["bitcoin"], useCase: "buy" }),
    );
  });

  it("opens the receive modal for the account", async () => {
    const { user, store } = renderHero(btcAccount);

    await user.click(await screen.findByTestId(`${ACTIONS}-receive`));

    expect(getModalData(store.getState(), "MODAL_RECEIVE")).toEqual(
      expect.objectContaining({ account: btcAccount }),
    );
  });

  it("opens the sell flow on the account when it holds a single sellable asset", async () => {
    mockRamp([], ["bitcoin"]);
    const { user } = renderHero(btcAccount);

    await user.click(await screen.findByTestId(`${ACTIONS}-sell`));

    const location = JSON.parse(screen.getByTestId("current-location").textContent ?? "{}");
    expect(location).toEqual({
      pathname: "/exchange",
      state: expect.objectContaining({ currency: "bitcoin", account: btcAccount.id }),
    });
  });
});
