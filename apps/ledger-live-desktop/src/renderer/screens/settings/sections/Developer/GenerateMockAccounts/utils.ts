import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CURRENCIES_WITH_STABLECOINS, getStablecoinTokensForCurrency } from "./stablecoins";
import { initAccounts } from "~/renderer/actions/accounts";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import { getKey } from "~/renderer/storage";
import { Account, AccountUserData } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { v4 as uuidv4 } from "uuid";
import sample from "lodash/sample";
import BigNumber from "bignumber.js";

export { CURRENCIES_WITH_STABLECOINS, getStablecoinTokensForCurrency } from "./stablecoins";

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

export const createAccountWithStablecoins = (
  currency: CryptoCurrency,
): [Account, AccountUserData] => {
  const stablecoins = getStablecoinTokensForCurrency(currency.id);
  const account = genAccount(uuidv4(), {
    currency,
    tokensData: stablecoins,
    tokenIds: stablecoins.map(t => t.id),
    subAccountsCount: stablecoins.length,
  });
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData];
};

// Ethereum is used as the default for empty accounts because it is the most commonly tested chain
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

export interface UnifiedAccountsConfig {
  randomEnabled: boolean;
  randomCount: number;
  emptyEnabled: boolean;
  stablecoinsEnabled: boolean;
  manualEnabled: boolean;
  selectedCurrencyIds: string[];
  tokenIds?: string;
}

export const generateUnifiedAccounts = (
  config: UnifiedAccountsConfig,
): [Account, AccountUserData][] => {
  const accounts: [Account, AccountUserData][] = [];
  const needsSupported =
    config.stablecoinsEnabled || (config.manualEnabled && config.selectedCurrencyIds.length > 0);
  const supported = needsSupported ? getSupportedCurrencies() : undefined;

  if (config.randomEnabled && config.randomCount > 0) {
    for (let i = 0; i < config.randomCount; i++) {
      accounts.push(createAccount(getRandomCurrency()));
    }
  }

  if (config.emptyEnabled) {
    accounts.push(createEmptyAccount());
  }

  if (config.stablecoinsEnabled) {
    for (const currencyId of CURRENCIES_WITH_STABLECOINS) {
      const currency = supported!.find(c => c.id === currencyId);
      if (currency) {
        accounts.push(createAccountWithStablecoins(currency));
      }
    }
  }

  if (config.manualEnabled && config.selectedCurrencyIds.length > 0) {
    const currencies = supported!.filter(c => config.selectedCurrencyIds.includes(c.id));
    for (const currency of currencies) {
      accounts.push(createAccount(currency, config.tokenIds));
    }
  }

  return accounts;
};
