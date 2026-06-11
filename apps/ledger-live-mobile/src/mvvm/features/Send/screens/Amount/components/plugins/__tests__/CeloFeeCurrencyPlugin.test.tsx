import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { CeloFeeCurrencyPlugin } from "../CeloFeeCurrencyPlugin";
import type { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import type { TokenAccount } from "@ledgerhq/types-live";

const mockUpdateTransaction = jest.fn();
const transactionActions = {
  updateTransaction: mockUpdateTransaction,
  setTransaction: jest.fn(),
  setRecipient: jest.fn(),
  setAccount: jest.fn(),
} as never;

jest.mock("@ledgerhq/live-common/account/index", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/account/index");
  const mocked: Record<string, unknown> = { __esModule: true };
  for (const key of Object.keys(actual)) {
    let value: unknown;
    let assigned = false;
    Object.defineProperty(mocked, key, {
      configurable: true,
      enumerable: true,
      get: () => (assigned ? value : actual[key]),
      set: v => {
        value = v;
        assigned = true;
      },
    });
  }

  mocked.getMainAccount = (account: unknown, parentAccount: unknown) => parentAccount ?? account;
  mocked.findSubAccountById = (account: { subAccounts?: { id: string }[] }, id: string | null) =>
    account.subAccounts?.find(sub => sub.id === id) ?? null;

  return mocked;
});

const usdcContractAddress = "0xceba9300f2b948710d2653dd7b07f33a8b32118c";
const unknownContractAddress = "0x0000000000000000000000000000000000000001";

const usdcSubAccount: TokenAccount = {
  type: "TokenAccount",
  id: "usdc-sub-account-id",
  parentId: "celo-account-id",
  token: {
    type: "TokenCurrency",
    id: "celo/erc20/usdc",
    contractAddress: usdcContractAddress,
    parentCurrency: { id: "celo" } as never,
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  } as never,
  balance: new BigNumber(100) as never,
  spendableBalance: new BigNumber(100) as never,
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

const unknownTokenSubAccount: TokenAccount = {
  ...usdcSubAccount,
  id: "unknown-sub-account-id",
  token: {
    ...usdcSubAccount.token,
    contractAddress: unknownContractAddress,
    name: "Unknown Token",
    ticker: "UNK",
  } as never,
};

const mockCeloAccount: CeloAccount = {
  type: "Account",
  id: "celo-account-id",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/52752'/0'/0/0",
  used: true,
  balance: new BigNumber(1000) as never,
  spendableBalance: new BigNumber(1000) as never,
  creationDate: new Date(),
  blockHeight: 100000,
  currency: { id: "celo", family: "celo" } as never,
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
  celoResources: {
    registrationStatus: false,
    lockedBalance: new BigNumber(0) as never,
    nonvotingLockedBalance: new BigNumber(0) as never,
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: new BigNumber(0) as never,
  },
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

describe("CeloFeeCurrencyPlugin (mvvm)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null for non-celo transactions", () => {
    const { toJSON } = render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={{ ...baseTransaction, family: "bitcoin" } as never}
        transactionActions={transactionActions}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders CELO selected by default", () => {
    render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={baseTransaction as never}
        transactionActions={transactionActions}
      />,
    );

    expect(screen.getByText("CELO")).toBeDefined();
  });

  it("shows USDC as selected when feeCurrencyAccountId matches a USDC sub-account", () => {
    render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={{ ...baseTransaction, feeCurrencyAccountId: "usdc-sub-account-id" } as never}
        transactionActions={transactionActions}
      />,
    );

    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("calls updateTransaction with USDC fields when USDC is selected from the drawer", async () => {
    const { user } = render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={baseTransaction as never}
        transactionActions={transactionActions}
      />,
    );

    await user.press(screen.getByText("CELO"));
    await user.press(screen.getAllByText("USDC")[0]);

    expect(mockUpdateTransaction).toHaveBeenCalled();
    const patched = runUpdater(baseTransaction);
    expect(patched).toMatchObject({
      feeCurrencyAccountId: "usdc-sub-account-id",
      feeCurrency: expect.any(String),
      feeCurrencyUnwrapped: expect.any(String),
    });
  });

  it("calls updateTransaction with null fee currency when native CELO is selected from the drawer", async () => {
    const { user } = render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={{ ...baseTransaction, feeCurrencyAccountId: "usdc-sub-account-id" } as never}
        transactionActions={transactionActions}
      />,
    );

    await user.press(screen.getByText("USDC"));
    const celoOptions = screen.getAllByText("CELO");
    await user.press(celoOptions[celoOptions.length - 1]);

    expect(mockUpdateTransaction).toHaveBeenCalled();
    const patched = runUpdater({ ...baseTransaction, feeCurrencyAccountId: "usdc-sub-account-id" });
    expect(patched).toMatchObject({
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("filters out token sub-accounts with zero balance", async () => {
    const zeroBalance: TokenAccount = {
      ...usdcSubAccount,
      balance: new BigNumber(0) as never,
      spendableBalance: new BigNumber(0) as never,
    };
    const account: CeloAccount = { ...mockCeloAccount, subAccounts: [zeroBalance] };

    const { user } = render(
      <CeloFeeCurrencyPlugin
        account={account as never}
        parentAccount={null}
        transaction={baseTransaction as never}
        transactionActions={transactionActions}
      />,
    );

    await user.press(screen.getByText("CELO"));
    expect(screen.queryAllByText("USDC").length).toBe(0);
  });

  it("resets feeCurrencyAccountId when the persisted sub-account is no longer selectable", () => {
    render(
      <CeloFeeCurrencyPlugin
        account={mockCeloAccount as never}
        parentAccount={null}
        transaction={{ ...baseTransaction, feeCurrencyAccountId: "missing-id" } as never}
        transactionActions={transactionActions}
      />,
    );

    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    const patched = runUpdater({ ...baseTransaction, feeCurrencyAccountId: "missing-id" });
    expect(patched).toMatchObject({
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
  });

  it("does not reset feeCurrencyAccountId while sub-accounts are unhydrated", () => {
    const accountUnhydrated: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: undefined as never,
    };

    render(
      <CeloFeeCurrencyPlugin
        account={accountUnhydrated as never}
        parentAccount={null}
        transaction={{ ...baseTransaction, feeCurrencyAccountId: "usdc-sub-account-id" } as never}
        transactionActions={transactionActions}
      />,
    );

    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("shows the token label while sub-accounts are unhydrated when feeCurrencyUnwrapped is set", () => {
    const accountUnhydrated: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: undefined as never,
    };

    render(
      <CeloFeeCurrencyPlugin
        account={accountUnhydrated as never}
        parentAccount={null}
        transaction={
          {
            ...baseTransaction,
            feeCurrencyAccountId: "usdc-sub-account-id",
            feeCurrencyUnwrapped: usdcContractAddress,
          } as never
        }
        transactionActions={transactionActions}
      />,
    );

    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("falls back to CELO label when feeCurrencyAccountId points to an unknown contract", () => {
    const account: CeloAccount = { ...mockCeloAccount, subAccounts: [unknownTokenSubAccount] };

    render(
      <CeloFeeCurrencyPlugin
        account={account as never}
        parentAccount={null}
        transaction={
          { ...baseTransaction, feeCurrencyAccountId: "unknown-sub-account-id" } as never
        }
        transactionActions={transactionActions}
      />,
    );

    expect(screen.getByText("CELO")).toBeDefined();
  });
});
