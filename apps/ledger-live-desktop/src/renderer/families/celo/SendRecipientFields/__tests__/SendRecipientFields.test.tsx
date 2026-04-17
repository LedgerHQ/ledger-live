import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import SendRecipientFields from "../index";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { CeloAccount, Transaction } from "@ledgerhq/live-common/families/celo/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

const mockSelectAccount = jest.fn();
jest.mock("~/renderer/components/SelectAccount", () => ({
  __esModule: true,
  default: (props: {
    onChange: (a: AccountLike | null | undefined) => void;
    value: AccountLike | null | undefined;
    filter?: (a: CeloAccount) => boolean;
    subAccountFilter?: (a: TokenAccount) => boolean;
    [key: string]: unknown;
  }) => {
    mockSelectAccount(props);
    return <div data-testid="select-account" />;
  },
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account"),
  findSubAccountById: jest.fn(),
  isTokenAccount: jest.fn(),
}));

// ── Helpers to access mocked functions ───────────────────────────────────────

function getMockedAccountUtils() {
  const mocked = jest.requireMock("@ledgerhq/ledger-wallet-framework/account") as {
    findSubAccountById: jest.MockedFunction<
      (account: AccountLike, id: string) => AccountLike | undefined
    >;
    isTokenAccount: jest.MockedFunction<(account: AccountLike) => boolean>;
  };
  return mocked;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

// Real FEE_CURRENCY_BY_CONTRACT values from constants.ts
const USDT_CONTRACT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";
const USDT_ADAPTER = "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72";
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const mockCeloCurrency = {
  type: "CryptoCurrency" as const,
  id: "celo",
  coinType: 52,
  name: "Celo",
  managerAppName: "Celo",
  ticker: "CELO",
  scheme: "celo",
  color: "#35D07F",
  family: "celo",
  units: [{ name: "CELO", code: "CELO", magnitude: 18 }],
  explorerViews: [],
};

const mockAccount = {
  type: "Account" as const,
  id: "celo-account-1",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xCELO_ACCOUNT_ADDRESS",
  freshAddressPath: "44'/52'/0'/0/0",
  freshAddresses: [],
  name: "Celo Account",
  starred: false,
  used: true,
  balance: new BigNumber(1000000000000000000),
  spendableBalance: new BigNumber(1000000000000000000),
  creationDate: new Date(),
  blockHeight: 0,
  currency: mockCeloCurrency,
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
  celoResources: {
    registrationStatus: true,
    lockedBalance: new BigNumber(0),
    nonvotingLockedBalance: new BigNumber(0),
    pendingWithdrawals: [],
    votes: [],
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: new BigNumber(10),
  },
};

const mockTransaction: Transaction = {
  family: "celo",
  amount: new BigNumber(100),
  recipient: "0xRECIPIENT",
  fees: null,
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
  mode: "send",
  index: null,
};

const makeTokenAccount = (contractAddress: string, id = "sub-account-1"): TokenAccount => ({
  type: "TokenAccount" as const,
  id,
  parentId: "celo-account-1",
  token: {
    type: "TokenCurrency" as const,
    id: `celo/erc20/token_${contractAddress}`,
    contractAddress,
    parentCurrency: mockCeloCurrency,
    tokenType: "erc20",
    name: "Token",
    ticker: "TKN",
    units: [{ name: "Token", code: "TKN", magnitude: 6 }],
    disableCountervalue: false,
    delisted: false,
  },
  balance: new BigNumber(500),
  spendableBalance: new BigNumber(500),
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
});

const defaultProps = {
  parentAccount: {} as CeloAccount,
  account: mockAccount as CeloAccount,
  transaction: mockTransaction,
  onChange: jest.fn(),
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
  trackProperties: {},
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SendRecipientFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { findSubAccountById, isTokenAccount } = getMockedAccountUtils();
    findSubAccountById.mockReturnValue(undefined);
    isTokenAccount.mockReturnValue(false);
  });

  describe("module exports", () => {
    it("exports component and fields array", () => {
      expect(SendRecipientFields.component).toBeDefined();
      expect(SendRecipientFields.fields).toEqual([
        "feeCurrency",
        "feeCurrencyUnwrapped",
        "feeCurrencyAccountId",
      ]);
    });
  });

  describe("rendering", () => {
    it("renders the fee currency label", () => {
      render(<SendRecipientFields.component {...defaultProps} />);
      expect(screen.getByText("send.steps.amount.feeCurrency")).toBeInTheDocument();
    });

    it("renders SelectAccount component", () => {
      render(<SendRecipientFields.component {...defaultProps} />);
      expect(screen.getByTestId("select-account")).toBeInTheDocument();
    });

    it("initializes feeAccount from findSubAccountById when feeCurrencyAccountId is set", () => {
      const { findSubAccountById } = getMockedAccountUtils();
      const tokenAccount = makeTokenAccount(USDT_CONTRACT);
      findSubAccountById.mockReturnValue(tokenAccount);
      const transactionWithFeeId = { ...mockTransaction, feeCurrencyAccountId: "sub-account-1" };

      render(
        <SendRecipientFields.component {...defaultProps} transaction={transactionWithFeeId} />,
      );

      expect(findSubAccountById).toHaveBeenCalledWith(mockAccount, "sub-account-1");
      expect(mockSelectAccount).toHaveBeenCalledWith(
        expect.objectContaining({ value: tokenAccount }),
      );
    });

    it("initializes feeAccount to undefined when feeCurrencyAccountId is missing", () => {
      const { findSubAccountById } = getMockedAccountUtils();

      render(<SendRecipientFields.component {...defaultProps} />);

      expect(findSubAccountById).toHaveBeenCalledWith(mockAccount, "");
      expect(mockSelectAccount).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }));
    });

    it("passes withSubAccounts and enforceHideEmptySubAccounts to SelectAccount", () => {
      render(<SendRecipientFields.component {...defaultProps} />);

      expect(mockSelectAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          withSubAccounts: true,
          enforceHideEmptySubAccounts: true,
        }),
      );
    });
  });

  describe("filters", () => {
    let filter: (acc: CeloAccount) => boolean;
    let subAccountFilter: (acc: TokenAccount) => boolean;

    beforeEach(() => {
      render(<SendRecipientFields.component {...defaultProps} />);
      filter = mockSelectAccount.mock.calls[0][0].filter;
      subAccountFilter = mockSelectAccount.mock.calls[0][0].subAccountFilter;
    });

    it("passes subAccountFilter to SelectAccount", () => {
      expect(subAccountFilter).toEqual(expect.any(Function));
    });

    it("subAccountFilter allows USDT token account (supported fee currency)", () => {
      const usdtAccount = makeTokenAccount(USDT_CONTRACT);

      expect(subAccountFilter(usdtAccount)).toBe(true);
    });

    it("subAccountFilter allows USDT token account with uppercase contract address", () => {
      const usdtAccount = makeTokenAccount(USDT_CONTRACT.toUpperCase());

      expect(subAccountFilter(usdtAccount)).toBe(true);
    });

    it("subAccountFilter allows USDC token account (supported fee currency)", () => {
      const usdcAccount = makeTokenAccount(USDC_CONTRACT);

      expect(subAccountFilter(usdcAccount)).toBe(true);
    });

    it("subAccountFilter rejects token account with unsupported contract address", () => {
      const unknownTokenAccount = makeTokenAccount("0xdeadbeef00000000000000000000000000000000");

      expect(subAccountFilter(unknownTokenAccount)).toBe(false);
    });

    it("account filter allows the main CELO account with matching freshAddress", () => {
      const celoAccount = {
        ...mockAccount,
        currency: { ...mockCeloCurrency, family: "celo" },
        freshAddress: "0xCELO_ACCOUNT_ADDRESS",
      } as CeloAccount;

      expect(filter(celoAccount)).toBe(true);
    });

    it("account filter rejects a CELO account with a different freshAddress", () => {
      const otherCeloAccount = {
        ...mockAccount,
        id: "other-celo-account",
        freshAddress: "0xDIFFERENT_ADDRESS",
        currency: { ...mockCeloCurrency, family: "celo" },
      } as CeloAccount;

      expect(filter(otherCeloAccount)).toBe(false);
    });

    it("account filter rejects a non-CELO currency account", () => {
      const ethAccount = {
        ...mockAccount,
        currency: { ...mockCeloCurrency, family: "ethereum" },
        freshAddress: "0xCELO_ACCOUNT_ADDRESS",
      } as CeloAccount;

      expect(filter(ethAccount)).toBe(false);
    });
  });

  describe("onChangeAccount", () => {
    it("resets to native CELO when null is selected", () => {
      const onChange = jest.fn();
      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(null);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }),
      );
    });

    it("resets to native CELO when undefined is selected", () => {
      const onChange = jest.fn();
      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(undefined);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }),
      );
    });

    it("resets to native CELO when the main CELO account is selected", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const onChange = jest.fn();
      isTokenAccount.mockReturnValue(false);

      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(mockAccount);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }),
      );
    });

    it("sets USDT adapter address as feeCurrency when USDT token account selected", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const onChange = jest.fn();
      const usdtAccount = makeTokenAccount(USDT_CONTRACT, "usdt-sub-account");
      isTokenAccount.mockReturnValue(true);

      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(usdtAccount);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: USDT_ADAPTER,
          feeCurrencyUnwrapped: USDT_CONTRACT,
          feeCurrencyAccountId: "usdt-sub-account",
        }),
      );
    });

    it("sets USDC adapter address as feeCurrency when USDC token account selected", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const onChange = jest.fn();
      const usdcAccount = makeTokenAccount(USDC_CONTRACT, "usdc-sub-account");
      isTokenAccount.mockReturnValue(true);

      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(usdcAccount);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: USDC_ADAPTER,
          feeCurrencyUnwrapped: USDC_CONTRACT,
          feeCurrencyAccountId: "usdc-sub-account",
        }),
      );
    });

    it("preserves existing transaction fields when updating fee currency", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const onChange = jest.fn();
      const usdtAccount = makeTokenAccount(USDT_CONTRACT, "usdt-sub-account");
      isTokenAccount.mockReturnValue(true);

      const transactionWithRecipient = {
        ...mockTransaction,
        recipient: "0xSOME_RECIPIENT",
        amount: new BigNumber(999),
      };

      render(
        <SendRecipientFields.component
          {...defaultProps}
          transaction={transactionWithRecipient}
          onChange={onChange}
        />,
      );

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(usdtAccount);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "0xSOME_RECIPIENT",
          amount: new BigNumber(999),
        }),
      );
    });

    it("resets to native CELO when an unsupported token account is selected", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const onChange = jest.fn();
      const unknownTokenAccount = makeTokenAccount(
        "0xdeadbeef00000000000000000000000000000000",
        "unknown-sub-account",
      );
      isTokenAccount.mockReturnValue(true);

      render(<SendRecipientFields.component {...defaultProps} onChange={onChange} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(unknownTokenAccount);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }),
      );
    });

    it("updates feeAccount state so SelectAccount reflects the new value", () => {
      const { isTokenAccount } = getMockedAccountUtils();
      const usdtAccount = makeTokenAccount(USDT_CONTRACT, "usdt-sub-account");
      isTokenAccount.mockReturnValue(true);

      const { rerender } = render(<SendRecipientFields.component {...defaultProps} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(usdtAccount);

      rerender(<SendRecipientFields.component {...defaultProps} />);

      const lastCallProps =
        mockSelectAccount.mock.calls[mockSelectAccount.mock.calls.length - 1][0];
      expect(lastCallProps.value).toBe(usdtAccount);
    });

    it("sets feeAccount to null when null is passed (clears selection)", () => {
      const { rerender } = render(<SendRecipientFields.component {...defaultProps} />);

      const { onChange: onChangeAccount } = mockSelectAccount.mock.calls[0][0];
      onChangeAccount(null);

      rerender(<SendRecipientFields.component {...defaultProps} />);

      const lastCallProps =
        mockSelectAccount.mock.calls[mockSelectAccount.mock.calls.length - 1][0];
      expect(lastCallProps.value).toBeNull();
    });
  });
});
