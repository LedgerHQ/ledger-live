import { fn, Mock } from "@storybook/test";
import BigNumber from "bignumber.js";
import { bitcoinCurrency } from "./useSelectAssetFlow.mock";
import { Account } from "@ledgerhq/types-live";

export const useGetAccountIds: Mock = fn(() => []);
export const getBalanceHistoryWithCountervalue: Mock = fn(() => ({
  history: [
    {
      date: "2025-05-22T15:06:28.976Z",
      value: 119617,
      countervalue: 13261,
    },
  ],
}));
export const getPortfolioCount: Mock = fn(() => 0);
export const useCountervaluesState: Mock = fn(() => {});
export const getAccountTuplesForCurrency: Mock = fn(() => [
  {
    account: {
      type: "Account",
      derivationMode: "native_segwit",
      freshAddress: "bc1qprvchytjcdqfqp4cxwe4gp927sd38687m2pkdr",
      creationDate: "2024-12-10T09:27:22.000Z",
      balance: new BigNumber(31918),
      currency: bitcoinCurrency,
    },
  },
]);
export const accountsSelector: Mock = fn(state => state.accounts);
export const counterValueCurrencySelector: Mock = fn(state => state.currency);

export const Mocked_ETH_Account: Account[] = [
  {
    type: "Account",
    id: "js:2:ethereum:0x823ePB4bDa11da33a7F1C907D1171e5995Fe33c7:",
    used: true,
    seedIdentifier: "",
    derivationMode: "",
    index: 2,
    freshAddress: "",
    freshAddressPath: "",
    blockHeight: 20372078,
    creationDate: new Date(),
    balance: new BigNumber(1).multipliedBy(1e18),
    spendableBalance: new BigNumber(1).multipliedBy(1e18),
    operations: [],
    operationsCount: 0,
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
    lastSyncDate: new Date(),
    swapHistory: [],
    syncHash: "",
    balanceHistoryCache: {
      HOUR: {
        balances: [],
        latestDate: 1721768400000,
      },
      DAY: {
        balances: [],
        latestDate: 1721685600000,
      },
      WEEK: {
        balances: [],
        latestDate: 1721512800000,
      },
    },
    subAccounts: [],
    nfts: [],
  },
];
