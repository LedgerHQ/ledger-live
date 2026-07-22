import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { CryptoCurrencySchema } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import type { TokenAccount, Account } from "@ledgerhq/types-live";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";

export function createFixtureCryptoCurrency(family: string): CryptoCurrency {
  return CryptoCurrencySchema.parse({
    type: "CryptoCurrency",
    id: "testCoinId",
    coinType: 8008,
    name: "MyCoin",
    managerAppName: "MyCoin",
    ticker: "MYC",
    scheme: "mycoin",
    color: "#ff0000",
    family,
    units: [
      { name: "MYC", code: "MYC", magnitude: 8 },
      { name: "SmallestUnit", code: "SMALLESTUNIT", magnitude: 0 },
    ],
    explorerViews: [
      {
        address: "https://mycoinexplorer.com/account/$address",
        tx: "https://mycoinexplorer.com/transaction/$hash",
        token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
      },
    ],
  });
}

const defaultEthCryptoFamily = CRYPTO_CURRENCIES_REGISTRY["ethereum"];
const defaultERC20USDTToken = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  name: "Tether USD (ERC-20)",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
});

export function createFixtureTokenAccount(
  id = "00",
  token: TokenCurrency = defaultERC20USDTToken,
): TokenAccount {
  return {
    type: "TokenAccount",
    id: `js:2:ethereum:0x${id}:+ethereum%2Ferc20%2Fusd_tether__erc20_`,
    parentId: `js:2:ethereum:0x0${id}:`,
    token,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
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
  currency: CryptoCurrency = defaultEthCryptoFamily,
): Account {
  return {
    type: "Account",
    id: `js:2:${currency.id}:0x0${id}:`,
    seedIdentifier: "0x01",
    derivationMode: "ethM",
    index: 0,
    freshAddress: "0x01",
    freshAddressPath: "44'/60'/0'/0/0",
    used: false,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    blockHeight: 8168983,
    currency,
    xpub: currency.family === "bitcoin" ? "testxpub" : undefined,
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
