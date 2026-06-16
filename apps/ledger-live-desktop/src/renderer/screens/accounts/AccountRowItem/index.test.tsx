import React from "react";
import { render, screen } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import AccountRowItem from "./index";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

// Render i18n keys verbatim so assertions check the chosen key, not translated copy.
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

// Mock heavy children.
jest.mock("~/renderer/components/ContextMenu/AccountContextMenu", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../AccountSyncStatusIndicator", () => ({
  __esModule: true,
  default: () => <div data-testid="sync-status" />,
}));

jest.mock("~/renderer/components/Stars/Star", () => ({
  __esModule: true,
  default: () => <div data-testid="star" />,
}));

jest.mock("~/renderer/components/TokenRow", () => ({
  __esModule: true,
  default: () => <div data-testid="token-row" />,
}));

const mockEthCurrency = {
  type: "CryptoCurrency" as const,
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  managerAppName: "Ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "evm",
  explorerViews: [],
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
  tokenTypes: ["erc20"],
};

const makeTokenAccount = (id: string): TokenAccount =>
  ({
    type: "TokenAccount",
    id,
    parentId: "eth-account-1",
    token: {
      type: "TokenCurrency",
      id: `ethereum/erc20/${id}`,
      contractAddress: "0x0000000000000000000000000000000000000001",
      parentCurrencyId: mockEthCurrency.id,
      tokenType: "erc20",
      name: id,
      ticker: id.toUpperCase(),
      units: [{ name: id, code: id.toUpperCase(), magnitude: 6 }],
      disableCountervalue: false,
      delisted: false,
    },
    balance: new BigNumber(1000),
    spendableBalance: new BigNumber(1000),
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

const ethAccount: Account = {
  type: "Account",
  id: "eth-account-1",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xFRESH",
  freshAddressPath: "44'/60'/0'/0/0",
  used: true,
  balance: new BigNumber(1e18),
  spendableBalance: new BigNumber(1e18),
  creationDate: new Date(),
  blockHeight: 0,
  currency: mockEthCurrency as Account["currency"],
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
  subAccounts: [makeTokenAccount("usdt"), makeTokenAccount("dai")],
};

const defaultProps = {
  account: ethAccount,
  parentAccount: null,
  onClick: jest.fn(),
  range: "day" as const,
};

describe("AccountRowItem — useLLDCoinFamily tokenList wording", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the family-specific wording key when hasSpecificTokenWording is true", () => {
    mockFamily.mockReturnValue({ tokenList: { hasSpecificTokenWording: true } } as never);
    render(<AccountRowItem {...defaultProps} />);
    expect(screen.getByText("tokensList.evm.seeTokens")).toBeVisible();
  });

  it("uses the default wording key when hasSpecificTokenWording is falsy", () => {
    mockFamily.mockReturnValue({} as never);
    render(<AccountRowItem {...defaultProps} />);
    expect(screen.getByText("tokensList.seeTokens")).toBeVisible();
  });
});
