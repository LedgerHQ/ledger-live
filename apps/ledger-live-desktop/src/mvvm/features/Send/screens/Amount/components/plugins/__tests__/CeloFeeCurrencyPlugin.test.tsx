/* eslint-disable @typescript-eslint/consistent-type-assertions */
import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { CeloFeeCurrencyPlugin } from "../CeloFeeCurrencyPlugin";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CeloAccount } from "@ledgerhq/live-common/families/celo/types";

const mockUpdateTransaction = jest.fn();
const transactionActions = {
  updateTransaction: mockUpdateTransaction,
  setTransaction: jest.fn(),
  setRecipient: jest.fn(),
  setAccount: jest.fn(),
} as never;

const usdcContractAddress = "0xceba9300f2b948710d2653dd7b07f33a8b32118c";
const unknownContractAddress = "0x0000000000000000000000000000000000000001";

const usdcSubAccount = {
  type: "TokenAccount",
  id: "usdc-sub-account-id",
  parentId: "celo-account-id",
  token: {
    type: "TokenCurrency",
    id: "celo/erc20/usdc",
    contractAddress: usdcContractAddress,
    parentCurrencyId: "celo",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  },
  balance: new BigNumber(100),
  spendableBalance: new BigNumber(100),
  creationDate: new Date(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

const unknownTokenSubAccount = {
  ...usdcSubAccount,
  id: "unknown-sub-account-id",
  token: {
    ...usdcSubAccount.token,
    contractAddress: unknownContractAddress,
    name: "Unknown Token",
    ticker: "UNK",
  },
};

const mockCeloAccount = {
  type: "Account",
  id: "celo-account-id",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/52752'/0'/0/0",
  used: true,
  balance: new BigNumber(1000),
  spendableBalance: new BigNumber(1000),
  creationDate: new Date(),
  blockHeight: 100000,
  currency: { id: "celo", family: "celo" },
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  subAccounts: [usdcSubAccount],
};

const baseTransaction = {
  family: "celo" as const,
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  mode: "send" as const,
  index: null,
  fees: null,
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

function runUpdater(currentTx: object) {
  return mockUpdateTransaction.mock.calls[0][0](currentTx);
}

function renderPlugin(overrides?: {
  account?: Partial<CeloAccount>;
  transaction?: Partial<Transaction>;
}) {
  const account = { ...mockCeloAccount, ...overrides?.account } as unknown as Account;
  const transaction = { ...baseTransaction, ...overrides?.transaction } as unknown as Transaction;
  return render(
    <CeloFeeCurrencyPlugin
      account={account}
      parentAccount={null}
      transaction={transaction}
      transactionActions={transactionActions}
    />,
  );
}

describe("CeloFeeCurrencyPlugin (mvvm)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null for non-celo transactions", () => {
    const { container } = renderPlugin({
      transaction: { family: "bitcoin" } as Partial<Transaction>,
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders CELO selected by default", () => {
    renderPlugin();

    const trigger = screen.getByTestId("send-celo-fee-currency-select");
    expect(trigger).toHaveTextContent("CELO");
  });

  it("shows USDC as selected when feeCurrencyAccountId matches a USDC sub-account", () => {
    renderPlugin({
      transaction: { feeCurrencyAccountId: "usdc-sub-account-id" } as Partial<Transaction>,
    });

    const trigger = screen.getByTestId("send-celo-fee-currency-select");
    expect(trigger).toHaveTextContent("USDC");
  });

  it("filters out token sub-accounts with zero balance from the selectable list", () => {
    const zeroBalance = {
      ...usdcSubAccount,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    };
    renderPlugin({
      account: { subAccounts: [zeroBalance] } as unknown as Partial<CeloAccount>,
      transaction: { feeCurrencyAccountId: "usdc-sub-account-id" } as Partial<Transaction>,
    });

    // Stale-id reset should fire because the zero-balance token is filtered out
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    const patched = runUpdater({
      ...baseTransaction,
      feeCurrencyAccountId: "usdc-sub-account-id",
    });
    expect(patched).toMatchObject({
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("resets feeCurrencyAccountId when the persisted sub-account is no longer selectable", () => {
    renderPlugin({
      account: { subAccounts: [] } as unknown as Partial<CeloAccount>,
      transaction: { feeCurrencyAccountId: "missing-id" } as Partial<Transaction>,
    });

    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    const patched = runUpdater({ ...baseTransaction, feeCurrencyAccountId: "missing-id" });
    expect(patched).toMatchObject({
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("does not reset feeCurrencyAccountId while sub-accounts are unhydrated", () => {
    renderPlugin({
      account: { subAccounts: undefined } as unknown as Partial<CeloAccount>,
      transaction: { feeCurrencyAccountId: "usdc-sub-account-id" } as Partial<Transaction>,
    });

    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("shows the token label while sub-accounts are unhydrated when feeCurrencyUnwrapped is set", () => {
    renderPlugin({
      account: { subAccounts: undefined } as unknown as Partial<CeloAccount>,
      transaction: {
        feeCurrencyAccountId: "usdc-sub-account-id",
        feeCurrencyUnwrapped: usdcContractAddress,
      } as unknown as Partial<Transaction>,
    });

    const trigger = screen.getByTestId("send-celo-fee-currency-select");
    expect(trigger).toHaveTextContent("USDC");
  });

  it("falls back to CELO label when feeCurrencyAccountId points to an unknown contract", () => {
    renderPlugin({
      account: { subAccounts: [unknownTokenSubAccount] } as unknown as Partial<CeloAccount>,
      transaction: { feeCurrencyAccountId: "unknown-sub-account-id" } as Partial<Transaction>,
    });

    // Stale-id reset fires because the unknown-contract token isn't in tokenOptions
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    const trigger = screen.getByTestId("send-celo-fee-currency-select");
    expect(trigger).toHaveTextContent("CELO");
  });
});
