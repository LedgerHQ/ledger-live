import React from "react";
import BigNumber from "bignumber.js";
import { render } from "tests/testSetup";
import { RawSelectAccount } from "../SelectAccount";
import type { Account, TokenAccount } from "@ledgerhq/types-live";

const mockSelect = jest.fn();

jest.mock("~/renderer/components/Select", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockSelect(props);
    return <div data-testid="select" />;
  },
}));

jest.mock("@ledgerhq/live-wallet/store", () => ({
  ...jest.requireActual("@ledgerhq/live-wallet/store"),
  accountNameWithDefaultSelector: (_walletState: unknown, account: { id: string }) => account.id,
}));

const celoCurrency = {
  type: "CryptoCurrency" as const,
  id: "celo",
  name: "Celo",
  ticker: "CELO",
  managerAppName: "Celo",
  coinType: 52,
  scheme: "celo",
  color: "#35D07F",
  family: "celo",
  explorerViews: [],
  units: [{ name: "CELO", code: "CELO", magnitude: 18 }],
};

const makeTokenAccount = (id: string, contractAddress: string): TokenAccount =>
  ({
    type: "TokenAccount",
    id,
    parentId: "parent-celo",
    token: {
      type: "TokenCurrency",
      id: `celo/erc20/${id}`,
      contractAddress,
      parentCurrencyId: "celo",
      tokenType: "erc20",
      name: id,
      ticker: id.toUpperCase(),
      units: [{ name: id, code: id.toUpperCase(), magnitude: 6 }],
      disableCountervalue: false,
      delisted: false,
    },
    balance: new BigNumber(10),
    spendableBalance: new BigNumber(10),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
    swapHistory: [],
  }) as TokenAccount;

const parentAccount: Account = {
  type: "Account",
  id: "parent-celo",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xPARENT",
  freshAddressPath: "44'/52'/0'/0/0",
  used: true,
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
  creationDate: new Date(),
  blockHeight: 0,
  currency: celoCurrency,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: null },
    DAY: { balances: [], latestDate: null },
    WEEK: { balances: [], latestDate: null },
  },
  swapHistory: [],
  subAccounts: [
    makeTokenAccount("usdt", "0x1111111111111111111111111111111111111111"),
    makeTokenAccount("ceur", "0x2222222222222222222222222222222222222222"),
  ],
};

describe("RawSelectAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps all subaccounts when subAccountFilter is not provided", () => {
    render(
      <RawSelectAccount
        accounts={[parentAccount]}
        withSubAccounts
        onChange={jest.fn()}
        value={null}
      />,
    );

    const options = mockSelect.mock.calls[0][0].options;
    expect(options.map((o: { account: { id: string } }) => o.account.id)).toEqual([
      "parent-celo",
      "usdt",
      "ceur",
    ]);
  });

  it("filters only token subaccounts when subAccountFilter is provided", () => {
    render(
      <RawSelectAccount
        accounts={[parentAccount]}
        withSubAccounts
        subAccountFilter={subAccount => subAccount.id === "usdt"}
        onChange={jest.fn()}
        value={null}
      />,
    );

    const options = mockSelect.mock.calls[0][0].options;
    expect(options.map((o: { account: { id: string } }) => o.account.id)).toEqual([
      "parent-celo",
      "usdt",
    ]);
  });

  it("does not apply subAccountFilter when withSubAccounts is false", () => {
    render(
      <RawSelectAccount
        accounts={[parentAccount]}
        withSubAccounts={false}
        subAccountFilter={() => false}
        onChange={jest.fn()}
        value={null}
      />,
    );

    const options = mockSelect.mock.calls[0][0].options;
    expect(options.map((o: { account: { id: string } }) => o.account.id)).toEqual(["parent-celo"]);
  });
});
