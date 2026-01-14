import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenAccountTuples } from "../getTokenAccountTuples";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

describe("getTokenAccountTuples", () => {
  it("should return the correct token account tuples", () => {
    const result = getTokenAccountTuples(mockedCurrency, mockedNestedAccounts);
    expect(result).toEqual([
      {
        account: {
          ...mockedNestedAccounts[0],
        },
        subAccount: {
          ...mockedNestedAccounts[0].subAccounts[0],
        },
      },
    ]);
  });

  it("should return an empty array if no matching token accounts are found", () => {
    const result = getTokenAccountTuples(
      { ...mockedCurrency, id: "nonexistent" },
      mockedNestedAccounts,
    );
    expect(result).toEqual([]);
  });

  it("should handle nested accounts with no subAccounts", () => {
    const result = getTokenAccountTuples(mockedCurrency, [
      {
        ...mockedNestedAccounts[0],
        subAccounts: [],
      },
    ]);
    expect(result).toEqual([]);
  });
});

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

const mockedNestedAccounts = [
  {
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
  },
] satisfies Account[];
