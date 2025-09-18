import { Account } from "@ledgerhq/types-live";
import { formatDetailedAccount } from "../formatDetailedAccount";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const mockedCVSState = {
  data: {},
  status: {
    0: {},
  },
  cache: {},
} satisfies CounterValuesState;

const mockedCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  ledgerSignature:
    "3045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: {
    type: "CryptoCurrency",
    id: "ethereum",
    coinType: 60,
    name: "Ethereum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#0ebdcd",
    symbol: "Ξ",
    family: "evm",
    blockAvgTime: 15,
    units: [
      {
        name: "ether",
        code: "ETH",
        magnitude: 18,
      },
      {
        name: "Gwei",
        code: "Gwei",
        magnitude: 9,
      },
      {
        name: "Mwei",
        code: "Mwei",
        magnitude: 6,
      },
      {
        name: "Kwei",
        code: "Kwei",
        magnitude: 3,
      },
      {
        name: "wei",
        code: "wei",
        magnitude: 0,
      },
    ],
    ethereumLikeInfo: {
      chainId: 1,
    },
    explorerViews: [
      {
        tx: "https://etherscan.io/tx/$hash",
        address: "https://etherscan.io/address/$address",
        token: "https://etherscan.io/token/$contractAddress?a=$address",
      },
    ],
    keywords: ["eth", "ethereum"],
    explorerId: "eth",
  },
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
} satisfies CryptoOrTokenCurrency;

const mockedAccount = {
  type: "Account",
  id: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
  used: true,
  seedIdentifier: "none",
  derivationMode: "",
  index: 2,
  freshAddress: "0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7",
  freshAddressPath: "44'/60'/2'/0/0",
  blockHeight: 22538164,
  creationDate: new Date("2024-02-20T14:22:23.000Z"),
  balance: BigNumber("5105897282069089782"),
  spendableBalance: BigNumber("5105897282069089782"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  currency: mockedCurrency.parentCurrency,
  lastSyncDate: new Date("2025-05-22T11:38:20.767Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: {
      balances: [5105897282069089000, 5105897282069089000],
      latestDate: 1621670400000,
    },
    DAY: {
      balances: [5105897282069089000, 5105897282069089000],
      latestDate: 1621670400000,
    },
    WEEK: {
      balances: [5105897282069089000, 5105897282069089000],
      latestDate: 1621670400000,
    },
  },
  subAccounts: [
    {
      type: "TokenAccount",
      id: "subAccount1",
      parentId: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
      token: mockedCurrency,
      balance: BigNumber("1000000"),
      spendableBalance: BigNumber("1000000"),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      creationDate: new Date("2024-02-20T14:22:23.000Z"),
      swapHistory: [],
      balanceHistoryCache: {
        HOUR: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
        DAY: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
        WEEK: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
      },
    },
    {
      type: "TokenAccount",
      id: "subAccount2",
      parentId: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c9:",
      token: mockedCurrency,
      balance: BigNumber("1000000"),
      spendableBalance: BigNumber("1000000"),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      creationDate: new Date("2024-02-20T14:22:23.000Z"),
      swapHistory: [],
      balanceHistoryCache: {
        HOUR: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
        DAY: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
        WEEK: {
          balances: [1000000, 1000000],
          latestDate: 1621670400000,
        },
      },
    },
  ],
} satisfies Account;

describe("formatDetailedAccount", () => {
  it("should format the account correctly", () => {
    const account = mockedAccount;
    const parentAddress = "0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7";
    const state = mockedCVSState;
    const to = mockedCurrency.parentCurrency;

    const result = formatDetailedAccount(account, parentAddress, state, to);
    expect(result).toEqual({
      name: "Ethereum",
      id: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
      ticker: "ETH",
      balance: "5.10589 ETH",
      fiatValue: "5.10589 ETH",
      address: "0x833...e33c7",
      cryptoId: "ethereum",
      parentId: undefined,
    });
  });
  it("should format the token account correctly", () => {
    const account = mockedAccount.subAccounts[0];
    const parentAddress = "0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7";
    const state = mockedCVSState;
    const to = mockedCurrency;

    const result = formatDetailedAccount(account, parentAddress, state, to);
    expect(result).toEqual({
      name: "USD Coin",
      id: "subAccount1",
      ticker: "USDC",
      balance: "1 USDC",
      fiatValue: "1 USDC",
      address: "0x833...e33c7",
      cryptoId: "ethereum/erc20/usd__coin",
      parentId: "ethereum",
    });
  });
  it("should format the token account with a different parent address", () => {
    const account = mockedAccount.subAccounts[1];
    const parentAddress = "0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c9";
    const state = mockedCVSState;
    const to = mockedCurrency;

    const result = formatDetailedAccount(account, parentAddress, state, to);
    expect(result).toEqual({
      name: "USD Coin",
      id: "subAccount2",
      ticker: "USDC",
      balance: "1 USDC",
      fiatValue: "1 USDC",
      address: "0x833...e33c9",
      cryptoId: "ethereum/erc20/usd__coin",
      parentId: "ethereum",
    });
  });
  it("should handle an account with no subaccounts", () => {
    const account = {
      ...mockedAccount,
      subAccounts: [],
    };
    const parentAddress = "0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7";
    const state = mockedCVSState;
    const to = mockedCurrency.parentCurrency;
    const result = formatDetailedAccount(account, parentAddress, state, to);
    expect(result).toEqual({
      name: "Ethereum",
      id: "js:2:ethereum:0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7:",
      ticker: "ETH",
      balance: "5.10589 ETH",
      fiatValue: "5.10589 ETH",
      address: "0x833...e33c7",
      cryptoId: "ethereum",
      parentId: undefined,
    });
  });
});
