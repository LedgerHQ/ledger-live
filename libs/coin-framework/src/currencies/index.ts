import type { Currency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyByTicker, findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/index";
import { getCryptoAssetsStore } from "../crypto-assets";

export { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
export { sanitizeValueString } from "./sanitizeValueString";
export { parseCurrencyUnit } from "./parseCurrencyUnit";
export { formatCurrencyUnit, type formatCurrencyUnitOptions } from "./formatCurrencyUnit";
export { toLocaleString } from "./BigNumberToLocaleString";
export { isCurrencySupported, listSupportedCurrencies, setSupportedCurrencies } from "./support";

export const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  getCryptoAssetsStore().findTokenByTicker(ticker);
