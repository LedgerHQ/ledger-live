import React from "react";
import { mockDomMeasurements } from "./shared";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { arbitrumCurrency, hederaCurrency } from "../__mocks__/useSelectAssetFlow.mock";
import { ARB_ACCOUNT } from "../__mocks__/accounts.mock";
import BigNumber from "bignumber.js";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import { Provider } from "react-redux";
import createStore from "~/renderer/createStore";
import { render, screen } from "tests/testSetup";
import { Account } from "@ledgerhq/types-live";
import { act } from "react-dom/test-utils";
import { State } from "~/renderer/reducers";

beforeEach(async () => {
  mockDomMeasurements();
  LiveConfig.setConfig(liveConfig);
});

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

const mockScanAccountsSubscription = (accounts: Account[]) => {
  accounts.forEach(account => {
    act(() => triggerNext(account));
  });
  act(() => triggerComplete());
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

describe("ModularDrawerAddAccountFlowManager", () => {
  it("should find and add an account", async () => {
    const { user } = render(
      <Provider store={createStore({ state: undefined })}>
        <ModularDrawerAddAccountFlowManager currency={arbitrumCurrency} source="MADSource" />
      </Provider>,
    );

    expect(
      screen.getByText(/looking for any existing accounts on the blockchain/i),
    ).toBeInTheDocument();

    mockScanAccountsSubscription([ARB_ACCOUNT]);
    expect(screen.getByText(/we found 1 account/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should create an account", async () => {
    const { user } = render(
      <Provider store={createStore({ state: undefined })}>
        <ModularDrawerAddAccountFlowManager currency={arbitrumCurrency} source="MADSource" />
      </Provider>,
    );

    mockScanAccountsSubscription([NEW_ARB_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should navigate to fund an account", async () => {
    const { user } = render(
      <Provider store={createStore({ state: undefined })}>
        <ModularDrawerAddAccountFlowManager currency={arbitrumCurrency} source="MADSource" />
      </Provider>,
    );

    mockScanAccountsSubscription([NEW_ARB_ACCOUNT]);

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(screen.getByRole("button", { name: "Add funds to my account" }));

    expect(screen.getByText(/receive crypto from another wallet/i)).toBeInTheDocument();
  });

  it("should hide previously added accounts and show new account", async () => {
    const { user } = render(
      <Provider store={createStore({ state: { accounts: [ARB_ACCOUNT] } as State })}>
        <ModularDrawerAddAccountFlowManager currency={arbitrumCurrency} source="MADSource" />
      </Provider>,
    );

    mockScanAccountsSubscription([ARB_ACCOUNT, NEW_ARB_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(confirm).not.toBeDisabled();

    await user.click(confirm);
    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should error on already imported empty account", async () => {
    render(
      <Provider
        store={createStore({ state: { accounts: [ARB_ACCOUNT, NEW_ARB_ACCOUNT] } as State })}
      >
        <ModularDrawerAddAccountFlowManager currency={arbitrumCurrency} source="MADSource" />
      </Provider>,
    );

    mockScanAccountsSubscription([ARB_ACCOUNT, NEW_ARB_ACCOUNT]);

    expect(
      screen.getByText(
        "A new account cannot be added before you receive assets on your Arbitrum 2 account",
      ),
    ).toBeInTheDocument();
  });

  it("should error on a Hedera account with no associated accounts", async () => {
    render(
      <Provider store={createStore({ state: undefined })}>
        <ModularDrawerAddAccountFlowManager currency={hederaCurrency} source="MADSource" />
      </Provider>,
    );

    mockScanAccountsSubscription([]);

    expect(screen.getByText("We couldn't add a new Hedera account")).toBeInTheDocument();
  });
});
