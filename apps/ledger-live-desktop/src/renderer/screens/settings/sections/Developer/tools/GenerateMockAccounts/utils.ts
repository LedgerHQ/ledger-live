import { genAccount } from "@ledgerhq/live-common/mock/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
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
