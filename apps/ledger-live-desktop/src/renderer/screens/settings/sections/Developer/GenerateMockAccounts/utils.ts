import { genAccount } from "@ledgerhq/live-common/mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { initAccounts } from "~/renderer/actions/accounts";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import { getKey } from "~/renderer/storage";
import { Account, AccountUserData } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { v4 as uuidv4 } from "uuid";
import sample from "lodash/sample";
import BigNumber from "bignumber.js";

export const createAccount = (
  currency: CryptoCurrency,
  tokens?: string,
): [Account, AccountUserData] => {
  const tokenIds = tokens ? tokens.split(",").map(t => t.toLowerCase().trim()) : undefined;
  const account = genAccount(uuidv4(), {
    currency,
    tokenIds: tokenIds && tokenIds.length > 0 ? tokenIds : undefined,
  });
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData];
};

export const getSupportedCurrencies = () => {
  const currencies = listSupportedCurrencies();
  if (currencies.length === 0) {
    throw new Error("No supported currencies found");
  }
  return currencies;
};

export const getRandomCurrency = () => {
  const currencies = getSupportedCurrencies();
  const currency = sample(currencies);
  if (!currency) {
    throw new Error("Failed to sample currency");
  }
  return currency;
};

export const injectMockAccounts = async (
  accounts: [Account, AccountUserData][],
  replaceExisting = false,
) => {
  const accountData = replaceExisting ? [] : await getKey("app", "accounts", []);
  const store = window.ledger.store;

  const newAccountData = accountData?.concat(accounts);
  const e = initAccounts(newAccountData || []);
  store.dispatch(e);
};

export const generateRandomAccounts = (count: number): [Account, AccountUserData][] => {
  return Array(count)
    .fill(null)
    .map(() => {
      const currency = getRandomCurrency();
      return createAccount(currency);
    });
};

export const generateAccountsForCurrencies = (
  currencies: CryptoCurrency[],
  tokens?: string,
): [Account, AccountUserData][] => {
  return currencies.map(currency => createAccount(currency, tokens));
};

export const createEmptyAccount = (id = "eth-empty"): [Account, AccountUserData] => {
  const ethereumCurrency = getCryptoCurrencyById("ethereum");

  const account = genAccount(id, {
    currency: ethereumCurrency,
    operationsSize: 0,
  });
  account.balance = new BigNumber(0);
  account.spendableBalance = new BigNumber(0);
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData];
};

export const STABLECOIN_PRESET: { currencyId: string; tokenIds: string[] }[] = [
  {
    currencyId: "ethereum",
    tokenIds: [
      "ethereum/erc20/usd_tether__erc20_",
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/usds_stablecoin_0xdc035d45d973e3ec169d2276ddab16f1e407384f",
      "ethereum/erc20/usde",
      "ethereum/erc20/dai_stablecoin_v2_0",
    ],
  },
  {
    currencyId: "arbitrum",
    tokenIds: [
      "arbitrum/erc20/tether_usd",
      "arbitrum/erc20/usd_coin",
      "arbitrum/erc20/usde",
      "arbitrum/erc20/paypal_usd_0x46850ad61c2b7d64d08c9c754f45254596696984",
    ],
  },
  {
    currencyId: "optimism",
    tokenIds: [
      "optimism/erc20/tether_usd",
      "optimism/erc20/usd_coin",
      "optimism/erc20/usde_0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34",
    ],
  },
  {
    currencyId: "base",
    tokenIds: [
      "base/erc20/usd_coin",
      "base/erc20/usds_stablecoin_0x820c137fa70c8691f0e44dc420a5e53c168921dc",
      "base/erc20/usde_0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34",
    ],
  },
  {
    currencyId: "solana",
    tokenIds: [
      "solana/spl/es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
      "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
      "solana/spl/usds_usdswr9apdhk5bvjkmjzff41ffux8bsxdkcr81vtwca",
      "solana/spl/usde_dekqhypn7gmrj5cartqfawefqbzb33hyf6s5icwjeont",
      "solana/spl/paypal_usd_2b1kv6dkpanxd5ixfnxcpjxmkwqjjaymczfhsfu24gxo",
    ],
  },
  {
    currencyId: "tron",
    tokenIds: [
      "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
      "tron/trc20/tekxitehnzsmse2xqrbj4w32run966rdz8",
    ],
  },
  {
    currencyId: "algorand",
    tokenIds: ["algorand/asa/312769", "algorand/asa/31566704"],
  },
];

async function resolveTokens(tokenIds: string[]): Promise<TokenCurrency[]> {
  const store = getCryptoAssetsStore();
  const resolved = await Promise.all(tokenIds.map(id => store.findTokenById(id)));
  return resolved.filter((t): t is TokenCurrency => t !== null);
}

export async function generateStablecoinAccounts(): Promise<[Account, AccountUserData][]> {
  const results: [Account, AccountUserData][] = [];

  for (const entry of STABLECOIN_PRESET) {
    const currency = getCryptoCurrencyById(entry.currencyId);
    const tokens = await resolveTokens(entry.tokenIds);
    const account = genAccount(uuidv4(), { currency });
    account.subAccounts = tokens.map((token, i) => genTokenAccount(i, account, token));
    const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
    results.push([account, userData]);
  }

  return results;
}

export function generateStockAccounts(
  tokensByParent: { parentId: string; tokens: TokenCurrency[] }[],
): [Account, AccountUserData][] {
  const results: [Account, AccountUserData][] = [];

  for (const { parentId, tokens } of tokensByParent) {
    if (tokens.length === 0) continue;
    const currency = getCryptoCurrencyById(parentId);
    const account = genAccount(uuidv4(), { currency });
    account.subAccounts = tokens.map((token, i) => genTokenAccount(i, account, token));
    const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
    results.push([account, userData]);
  }

  return results;
}
