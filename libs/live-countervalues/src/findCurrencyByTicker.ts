import type { Currency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyByTicker, findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/index";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";

export const findCurrencyByTicker = async (ticker: string): Promise<Currency | null | undefined> =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  (await getCryptoAssetsStore().findTokenByTicker(ticker));
