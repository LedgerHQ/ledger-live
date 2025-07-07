import React from "react";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  hederaCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";
import { ARB_ACCOUNT, BTC_ACCOUNT } from "../__mocks__/accounts.mock";
import BigNumber from "bignumber.js";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import { Provider } from "react-redux";
import createStore from "~/renderer/createStore";
import { userEvent, render, screen } from "tests/testSetup";
import { Account } from "@ledgerhq/types-live";
import { act } from "react-dom/test-utils";
import { State } from "~/renderer/reducers";
import { openModal } from "~/renderer/actions/modals";
import { track, trackPage } from "~/renderer/analytics/segment";

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({
    useHook: () => {
      return {
        device: { modelId: "stax" },
        onResult: () => true,
        isLocked: false,
      };
    },
    mapResult: () => ({ device: { deviceId: 123456 } }),
  }),
}));

let triggerNext: (account: Account) => void = () => null;
let triggerComplete: () => void = () => null;

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getCurrencyBridge: () => ({
    scanAccounts: () => ({
      subscribe: ({
        next,
        complete,
      }: {
        next: ({ account }: { account: Account }) => void;
        complete: () => void;
      }) => {
        triggerNext = account => next({ account });
        triggerComplete = () => complete();
      },
    }),
    preload: () => true,
    hydrate: () => true,
  }),
}));

const mockScanAccountsSubscription = async (accounts: Account[]) => {
  await Promise.all(accounts.map(account => act(() => triggerNext(account))));
  await act(() => triggerComplete());
};

const NEW_ARB_ACCOUNT: Account = {
  type: "Account",
  id: "js:2:arbitrum:0xf97c24B5e0951db821b68CF7ce0e2F7BC9D93921:",
  seedIdentifier:
    "04618fc4d1ddca7549312fbb8d7f5567028e9023f633cb388f1e61473b1aa07e1871d31e20d544f1f4fd59b56d8ce0c4845010dde8b4504d28db650a5c4d1ed1a6",
  freshAddress: "0xf97c24B5e0951db821b68CF7ce0e2F7BC9D93921",
  freshAddressPath: "44'/60'/1'/0/0",
  derivationMode: "",
  used: false,
  index: 1,
  currency: {
    type: "CryptoCurrency",
    id: "arbitrum",
    coinType: 60,
    name: "Arbitrum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "arbitrum",
    color: "#28a0f0",
    family: "evm",
    units: [
      {
        name: "ETH",
        code: "ETH",
        magnitude: 18,
      },
    ],
    explorerViews: [],
  },
  operationsCount: 0,
  operations: [],
  swapHistory: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  creationDate: new Date(),
  balance: new BigNumber("0"),
  spendableBalance: new BigNumber("0"),
  blockHeight: 353794765,
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: 1751540400000,
    },
    DAY: {
      balances: [],
      latestDate: 1751497200000,
    },
    WEEK: {
      balances: [],
      latestDate: 1751151600000,
    },
  },
  syncHash: "0x87394383",
  subAccounts: [],
  nfts: [],
};

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  __esModule: true,
  useRampCatalog: () => ({
    isCurrencyAvailable: (currencyId: string) => currencyId === "arbitrum",
  }),
}));

const push = jest.fn();

jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({ push }),
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  openModal: jest.fn().mockReturnValue({ type: "" }),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const setup = (currency = arbitrumCurrency, state?: State) =>
  render(
    <Provider store={createStore({ state })}>
      <ModularDrawerAddAccountFlowManager currency={currency} source="MADSource" />
    </Provider>,
  );

function expectTrackPage(
  n: number,
  page: string,
  props: { flow?: string; reason?: string } = {},
  source = "MADSource",
) {
  expect(trackPage).toHaveBeenNthCalledWith(n, page, undefined, { ...props, source }, true, true);
}

describe("ModularDrawerAddAccountFlowManager", () => {
  beforeEach(() => {
    (track as jest.Mock).mockReset();
    (trackPage as jest.Mock).mockReset();
  });

  it("should find and add an account", async () => {
    setup();

    expect(
      screen.getByText(/looking for any existing accounts on the blockchain/i),
    ).toBeInTheDocument();
    expectTrackPage(1, "device connection", { flow: "Add account" });

    await mockScanAccountsSubscription([ARB_ACCOUNT]);
    expectTrackPage(2, "looking for accounts", { flow: "Add account" });
    expect(screen.getByText(/we found 1 account/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(track).toHaveBeenNthCalledWith(1, "button_clicked", {
      button: "Confirm",
      flow: "Add account",
      page: "looking for accounts",
    });
    expect(track).toHaveBeenNthCalledWith(2, "account_added", {
      amount: 1,
      currency: "Arbitrum",
    });

    expectTrackPage(3, "add account success");
    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should create an account", async () => {
    setup();

    await mockScanAccountsSubscription([NEW_ARB_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should navigate to fund an account for on-ramp currency", async () => {
    setup();

    await mockScanAccountsSubscription([NEW_ARB_ACCOUNT]);

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await userEvent.click(screen.getByRole("button", { name: "Add funds to my account" }));

    const buy = screen.getByText(/buy crypto securely with cash/i);
    await userEvent.click(buy);
    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({ state: expect.objectContaining({ mode: "buy" }) }),
    );

    const receive = screen.getByText(/receive crypto from another wallet/i);
    await userEvent.click(receive);
    expect(openModal).toHaveBeenCalledWith("MODAL_RECEIVE", expect.objectContaining({}));
    expect(track).toHaveBeenNthCalledWith(3, "button_clicked", {
      button: "Fund my account",
      flow: "Add account",
      page: "add account success",
    });
  });

  it("should navigate to fund an account for non-on-ramp currency", async () => {
    setup(bitcoinCurrency);

    await mockScanAccountsSubscription([BTC_ACCOUNT]);

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await userEvent.click(screen.getByRole("button", { name: "Add funds to my account" }));

    expect(screen.getByText(/receive crypto from another wallet/i)).toBeInTheDocument();
    expect(screen.queryByText(/buy crypto securely with cash/i)).not.toBeInTheDocument();
  });

  it("should hide previously added accounts and show new account", async () => {
    setup(arbitrumCurrency, { accounts: [ARB_ACCOUNT] } as State);

    await mockScanAccountsSubscription([ARB_ACCOUNT, NEW_ARB_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(confirm).not.toBeDisabled();

    await userEvent.click(confirm);
    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should error on already imported empty account", async () => {
    setup(arbitrumCurrency, { accounts: [ARB_ACCOUNT, NEW_ARB_ACCOUNT] } as State);

    await mockScanAccountsSubscription([ARB_ACCOUNT, NEW_ARB_ACCOUNT]);

    expect(
      screen.getByText(
        "A new account cannot be added before you receive assets on your Arbitrum 2 account",
      ),
    ).toBeInTheDocument();
    expectTrackPage(3, "cant add new account", { reason: "ALREADY_EMPTY_ACCOUNT" });
  });

  it("should error on a Hedera account with no associated accounts", async () => {
    setup(hederaCurrency);

    await mockScanAccountsSubscription([]);

    expect(screen.getByText("We couldn't add a new Hedera account")).toBeInTheDocument();
    expectTrackPage(3, "cant add new account", { reason: "NO_ASSOCIATED_ACCOUNTS" });
  });
});
