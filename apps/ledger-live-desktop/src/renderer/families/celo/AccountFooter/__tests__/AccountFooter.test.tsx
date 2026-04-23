import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import AccountFooter from "../index";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { CeloAccount, TransactionStatus } from "@ledgerhq/live-common/families/celo/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({
    val,
    unit,
    showCode,
  }: {
    val: BigNumber;
    unit: { code: string };
    showCode?: boolean;
  }) => (
    <div data-testid="formatted-val">
      {val.toFixed()} {showCode && unit?.code}
    </div>
  ),
}));

jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: ({ currency }: { currency: { name: string } }) => (
    <div data-testid="counter-value">{currency?.name}</div>
  ),
}));

jest.mock("~/renderer/components/CurrencyBadge", () => ({
  CurrencyCircleIcon: ({ currency, size }: { currency: { name: string }; size: number }) => (
    <div data-testid="currency-circle-icon" data-currency={currency?.name} data-size={size} />
  ),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account"),
  findSubAccountById: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMockedFindSubAccountById() {
  return jest.requireMock("@ledgerhq/ledger-wallet-framework/account")
    .findSubAccountById as jest.MockedFunction<
    (account: AccountLike, id: string) => AccountLike | undefined
  >;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const celoCurrency = {
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

const usdtToken = {
  type: "TokenCurrency" as const,
  id: "celo/erc20/usdt",
  contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  parentCurrency: celoCurrency,
  tokenType: "erc20" as const,
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
  disableCountervalue: false,
  delisted: false,
};

const mockMainAccount = {
  type: "Account" as const,
  id: "celo-account-1",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xCELO_ADDRESS",
  freshAddressPath: "44'/52'/0'/0/0",
  freshAddresses: [],
  name: "Celo Account",
  starred: false,
  used: true,
  balance: new BigNumber("1000000000000000000"),
  spendableBalance: new BigNumber("1000000000000000000"),
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
} as CeloAccount;

const mockUsdtSubAccount: TokenAccount = {
  type: "TokenAccount" as const,
  id: "usdt-sub-account-1",
  parentId: "celo-account-1",
  token: usdtToken,
  balance: new BigNumber(500_000_000),
  spendableBalance: new BigNumber(500_000_000),
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
};

const makeStatus = (
  overrides: Partial<TransactionStatus> & { feeCurrencyAccountId?: string | null } = {},
): TransactionStatus & { feeCurrencyAccountId?: string | null } => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber("100000000000000000"),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AccountFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMockedFindSubAccountById().mockReturnValue(undefined);
  });

  describe("label", () => {
    it("renders the estimated fees label", () => {
      render(<AccountFooter account={mockMainAccount} status={makeStatus()} />);

      expect(screen.getByText("send.footer.estimatedFees")).toBeInTheDocument();
    });
  });

  describe("when no feeCurrencyAccountId (native CELO fees)", () => {
    it("uses the CELO currency for the circle icon", () => {
      render(<AccountFooter account={mockMainAccount} status={makeStatus()} />);

      expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute("data-currency", "Celo");
    });

    it("renders circle icon with size 40", () => {
      render(<AccountFooter account={mockMainAccount} status={makeStatus()} />);

      expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute("data-size", "40");
    });

    it("renders FormattedVal with CELO unit code", () => {
      render(<AccountFooter account={mockMainAccount} status={makeStatus()} />);

      expect(screen.getByTestId("formatted-val")).toHaveTextContent("CELO");
    });

    it("renders CounterValue with CELO currency", () => {
      render(<AccountFooter account={mockMainAccount} status={makeStatus()} />);

      expect(screen.getByTestId("counter-value")).toHaveTextContent("Celo");
    });

    it("renders FormattedVal with estimated fees value", () => {
      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ estimatedFees: new BigNumber("250000000000000000") })}
        />,
      );

      expect(screen.getByTestId("formatted-val")).toHaveTextContent("250000000000000000");
    });
  });

  describe("when feeCurrencyAccountId matches a token sub-account", () => {
    beforeEach(() => {
      getMockedFindSubAccountById().mockReturnValue(mockUsdtSubAccount);
    });

    it("uses the token currency for the circle icon", () => {
      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "usdt-sub-account-1" })}
        />,
      );

      expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute(
        "data-currency",
        "Tether USD",
      );
    });

    it("renders FormattedVal with USDT unit code", () => {
      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "usdt-sub-account-1" })}
        />,
      );

      expect(screen.getByTestId("formatted-val")).toHaveTextContent("USDT");
    });

    it("renders CounterValue with USDT token currency", () => {
      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "usdt-sub-account-1" })}
        />,
      );

      expect(screen.getByTestId("counter-value")).toHaveTextContent("Tether USD");
    });

    it("calls findSubAccountById with the mainAccount and feeCurrencyAccountId", () => {
      const findSubAccountById = getMockedFindSubAccountById();

      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "usdt-sub-account-1" })}
        />,
      );

      expect(findSubAccountById).toHaveBeenCalledWith(mockMainAccount, "usdt-sub-account-1");
    });
  });

  describe("when feeCurrencyAccountId does not match any sub-account", () => {
    it("falls back to native CELO currency for the circle icon", () => {
      getMockedFindSubAccountById().mockReturnValue(undefined);

      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "non-existent-id" })}
        />,
      );

      expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute("data-currency", "Celo");
    });

    it("falls back to CELO fees unit", () => {
      getMockedFindSubAccountById().mockReturnValue(undefined);

      render(
        <AccountFooter
          account={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "non-existent-id" })}
        />,
      );

      expect(screen.getByTestId("formatted-val")).toHaveTextContent("CELO");
    });
  });

  describe("when account is a token account (parentAccount provided)", () => {
    const tokenAccount: TokenAccount = {
      ...mockUsdtSubAccount,
      id: "token-account-as-account",
    };

    it("uses parentAccount as the main account for fee currency lookup", () => {
      const findSubAccountById = getMockedFindSubAccountById();
      findSubAccountById.mockReturnValue(undefined);

      render(
        <AccountFooter
          account={tokenAccount}
          parentAccount={mockMainAccount}
          status={makeStatus({ feeCurrencyAccountId: "some-id" })}
        />,
      );

      // getMainAccount returns parentAccount when account is TokenAccount
      expect(findSubAccountById).toHaveBeenCalledWith(mockMainAccount, "some-id");
    });

    it("shows the token account's currency when no feeCurrencyAccountId", () => {
      render(
        <AccountFooter
          account={tokenAccount}
          parentAccount={mockMainAccount}
          status={makeStatus()}
        />,
      );

      // account currency is the token (USDT), parentAccount is used for fees
      expect(screen.getByTestId("currency-circle-icon")).toHaveAttribute(
        "data-currency",
        "Tether USD",
      );
    });
  });
});
