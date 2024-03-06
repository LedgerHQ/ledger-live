import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export let getConfig: ((currency: CryptoCurrency) => unknown) | undefined;

export const setGetConfig = (getConfigCallback: (currency: CryptoCurrency) => unknown): void => {
  getConfig = getConfigCallback;
};
