import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getTokenUnit } from "./getTokenUnit"; // Remplace par le bon chemin

const mockedAccount: Account = {
  type: "Account",
  id: "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
  used: true,
  seedIdentifier: "",
  derivationMode: "",
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
  blockHeight: 21923656,
  creationDate: new Date(),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operations: [],
  operationsCount: 221,
  pendingOperations: [],
  currency: {
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
    ],
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
  lastSyncDate: new Date(),
  swapHistory: [],
  syncHash: "0x284974b9",
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: 1740488400000,
    },
    DAY: {
      balances: [],
      latestDate: 1740438000000,
    },
    WEEK: {
      balances: [],
      latestDate: 1740265200000,
    },
  },
  subAccounts: [
    {
      type: "TokenAccount",
      id: "",
      parentId: "",
      token: {
        type: "TokenCurrency",
        id: "ethereum/erc20/usd__coin",

        contractAddress: "0xContractAddress",
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
          ],

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
      },
      creationDate: new Date(),
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operationsCount: 7,
      operations: [],
      pendingOperations: [],
      swapHistory: [],
      balanceHistoryCache: {
        HOUR: {
          balances: [],
          latestDate: 1740488400000,
        },
        DAY: {
          balances: [],
          latestDate: 1740438000000,
        },
        WEEK: {
          balances: [],
          latestDate: 1740265200000,
        },
      },
    },
  ],
};

describe("getTokenUnit", () => {
  it("should return the token unit when contractAddress matches", () => {
    expect(getTokenUnit("Amount", mockedAccount, "0xContractAddress")).toEqual({
      name: "ether",
      code: "ETH",
      magnitude: 18,
    });
  });

  it("should return undefined if contractAddress does not match", () => {
    expect(getTokenUnit("Amount", mockedAccount, "0xWrongToken")).toBeUndefined();
  });

  it("should return undefined if account is undefined", () => {
    expect(getTokenUnit("Amount", undefined, "0xContractAddress")).toBeUndefined();
  });

  it("should return undefined if label does not contain 'Amount'", () => {
    expect(getTokenUnit("NotAmount", mockedAccount, "0xContractAddress")).toBeUndefined();
  });
});
