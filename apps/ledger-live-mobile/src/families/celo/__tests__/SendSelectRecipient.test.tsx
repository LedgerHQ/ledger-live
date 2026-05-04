import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import { SendRecipientFields } from "../SendSelectRecipient";
import type { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import type { TokenAccount } from "@ledgerhq/types-live";

const mockSetTransaction = jest.fn();
const mockUpdateTransaction = jest.fn((_tx: unknown, patch: unknown) => ({
  ...(_tx as object),
  ...(patch as object),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn().mockReturnValue({
    updateTransaction: (tx: unknown, patch: unknown) => mockUpdateTransaction(tx, patch),
  }),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: (_account: unknown, parentAccount: unknown) => parentAccount ?? _account,
  findSubAccountById: (account: { subAccounts?: { id: string }[] }, id: string | null) =>
    account.subAccounts?.find(sub => sub.id === id) ?? null,
}));

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
  balance: { toNumber: () => 100 } as never,
  spendableBalance: { toNumber: () => 100 } as never,
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

// Sub-account with a real BigNumber balance so it passes the `new BigNumber(balance).gt(0)` filter
const usdcSubAccountWithBalance: TokenAccount = {
  ...usdcSubAccount,
  balance: new BigNumber(100) as never,
  spendableBalance: new BigNumber(100) as never,
};

// Sub-account whose contract address is NOT in FEE_CURRENCY_BY_CONTRACT
const unknownTokenSubAccount: TokenAccount = {
  ...usdcSubAccount,
  id: "unknown-sub-account-id",
  token: {
    ...usdcSubAccount.token,
    contractAddress: unknownContractAddress,
    name: "Unknown Token",
    ticker: "UNK",
  } as never,
  balance: new BigNumber(100) as never,
  spendableBalance: new BigNumber(100) as never,
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
  balance: { toNumber: () => 1000 } as never,
  spendableBalance: { toNumber: () => 1000 } as never,
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
    lockedBalance: { toNumber: () => 0 } as never,
    nonvotingLockedBalance: { toNumber: () => 0 } as never,
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: { toNumber: () => 0 } as never,
  },
};

const baseTransaction = {
  family: "celo" as const,
  amount: { toNumber: () => 0 } as never,
  recipient: "",
  useAllAmount: false,
  mode: "send" as const,
  index: null,
  fees: null,
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

describe("SendRecipientFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the fee currency selector with CELO selected by default", () => {
    render(
      <SendRecipientFields
        account={mockCeloAccount as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    expect(screen.getByText("CELO")).toBeDefined();
  });

  it("shows USDC as selected fee currency when feeCurrencyAccountId matches USDC sub-account", () => {
    const transaction = {
      ...baseTransaction,
      feeCurrencyAccountId: "usdc-sub-account-id",
    };

    render(
      <SendRecipientFields
        account={mockCeloAccount as never}
        transaction={transaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("opens the drawer when the fee currency selector is pressed", async () => {
    const { user } = render(
      <SendRecipientFields
        account={mockCeloAccount as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    // Press the selector to open the drawer
    await user.press(screen.getByText("CELO"));

    // After opening the drawer, CELO should appear as an option in the list
    const celoTexts = screen.getAllByText("CELO");
    expect(celoTexts.length).toBeGreaterThan(0);
  });

  it("calls setTransaction with null fee currency when native CELO is selected from drawer", async () => {
    const transactionWithUsdc = {
      ...baseTransaction,
      feeCurrencyAccountId: "usdc-sub-account-id",
    };

    const { user } = render(
      <SendRecipientFields
        account={mockCeloAccount as never}
        transaction={transactionWithUsdc as never}
        setTransaction={mockSetTransaction}
      />,
    );

    // Open the drawer
    await user.press(screen.getByText("USDC"));

    // Select native CELO (first CELO in the list is the selector, second is in the drawer)
    const celoOptions = screen.getAllByText("CELO");
    await user.press(celoOptions[celoOptions.length - 1]);

    expect(mockSetTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        feeCurrency: null,
        feeCurrencyUnwrapped: null,
        feeCurrencyAccountId: null,
      }),
    );
  });

  it("renders without sub-accounts when account has no token sub-accounts", () => {
    const accountWithoutTokens: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: [],
    };

    render(
      <SendRecipientFields
        account={accountWithoutTokens as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    expect(screen.getByText("CELO")).toBeDefined();
  });

  it("renders USDC as an option in the drawer when sub-account has positive balance", async () => {
    const accountWithBalance: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: [usdcSubAccountWithBalance],
    };

    const { user } = render(
      <SendRecipientFields
        account={accountWithBalance as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    await user.press(screen.getByText("CELO"));

    const usdcOptions = screen.getAllByText("USDC");
    expect(usdcOptions.length).toBeGreaterThan(0);
  });

  it("calls setTransaction with USDC fee currency when USDC is selected from drawer", async () => {
    const accountWithBalance: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: [usdcSubAccountWithBalance],
    };

    const { user } = render(
      <SendRecipientFields
        account={accountWithBalance as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    await user.press(screen.getByText("CELO"));
    await user.press(screen.getAllByText("USDC")[0]);

    expect(mockSetTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        feeCurrencyAccountId: "usdc-sub-account-id",
        feeCurrency: expect.any(String),
        feeCurrencyUnwrapped: expect.any(String),
      }),
    );
  });

  it("filters out sub-accounts with zero balance from token options in drawer", async () => {
    const zeroBalanceSubAccount: TokenAccount = {
      ...usdcSubAccount,
      balance: new BigNumber(0) as never,
      spendableBalance: new BigNumber(0) as never,
    };
    const accountWithZeroBalance: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: [zeroBalanceSubAccount],
    };

    const { user } = render(
      <SendRecipientFields
        account={accountWithZeroBalance as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    await user.press(screen.getByText("CELO"));

    // USDC should not appear as a selectable option since balance is 0
    expect(screen.queryAllByText("USDC").length).toBe(0);
  });

  it("falls back to CELO name when feeCurrencyAccountId points to sub-account with unknown contract", () => {
    const accountWithUnknown: CeloAccount = {
      ...mockCeloAccount,
      subAccounts: [unknownTokenSubAccount],
    };
    const transaction = {
      ...baseTransaction,
      feeCurrencyAccountId: "unknown-sub-account-id",
    };

    render(
      <SendRecipientFields
        account={accountWithUnknown as never}
        transaction={transaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    // selectedName falls back to FEE_CURRENCY_OPTIONS[0].name which is "CELO"
    expect(screen.getByText("CELO")).toBeDefined();
  });

  it("renders with parentAccount provided", () => {
    const parentAccount: CeloAccount = {
      ...mockCeloAccount,
      id: "parent-account-id",
    };

    render(
      <SendRecipientFields
        account={mockCeloAccount as never}
        parentAccount={parentAccount as never}
        transaction={baseTransaction as never}
        setTransaction={mockSetTransaction}
      />,
    );

    expect(screen.getByText("CELO")).toBeDefined();
  });
});
