import BigNumber from "bignumber.js";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { TokenAccount, Account } from "@ledgerhq/types-live";
import { cryptocurrenciesById, findTokenById } from "@ledgerhq/cryptoassets";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

export function createFixtureCryptoCurrency(family: string): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: "testCoinId" as CryptoCurrencyId,
    coinType: 8008,
    name: "MyCoin",
    managerAppName: "MyCoin",
    ticker: "MYC",
    countervalueTicker: "MYC",
    scheme: "mycoin",
    color: "#ff0000",
    family,
    units: [
      {
        name: "MYC",
        code: "MYC",
        magnitude: 8,
      },
      {
        name: "SmallestUnit",
        code: "SMALLESTUNIT",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://mycoinexplorer.com/account/$address",
        tx: "https://mycoinexplorer.com/transaction/$hash",
        token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
      },
    ],
  };
}

const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];
const defaultERC20USDTToken = findTokenById["usd_tether__erc20_"];

export function createFixtureTokenAccount(
  id = "00",
  token: TokenCurrency = defaultERC20USDTToken
): TokenAccount {
  return {
    type: "TokenAccount",
    id: `js:2:ethereum:0x${id}:+ethereum%2Ferc20%2Fusd_tether__erc20_`,
    parentId: `ethereumjs:2:ethereum:0x0${id}:`,
    token,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    starred: false,
    balanceHistoryCache: {
      HOUR: {
        balances: [],
        latestDate: undefined,
      },
      DAY: {
        balances: [],
        latestDate: undefined,
      },
      WEEK: {
        balances: [],
        latestDate: undefined,
      },
    },
    swapHistory: [],
  };
}

export function createFixtureAccount(
  id = "00",
  currency: CryptoCurrency = defaultEthCryptoFamily
): Account {
  return {
    type: "Account",
    id: `${currency.family}js:2:${currency.family}:0x0${id}:`,
    seedIdentifier: "0x01",
    derivationMode: "ethM",
    index: 0,
    freshAddress: "0x01",
    freshAddressPath: "44'/60'/0'/0/0",
    freshAddresses: [],
    name: "Ethereum 1",
    starred: false,
    used: false,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    blockHeight: 8168983,
    currency,
    xpub: currency.family === "bitcoin" ? "testxpub" : undefined,
    unit: {
      name: "satoshi",
      code: "BTC",
      magnitude: 5,
    },
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: {
        balances: [],
        latestDate: undefined,
      },
      DAY: {
        balances: [],
        latestDate: undefined,
      },
      WEEK: {
        balances: [],
        latestDate: undefined,
      },
    },
    swapHistory: [],
  };
}
