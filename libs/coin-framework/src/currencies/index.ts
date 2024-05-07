import type { Currency } from "@ledgerhq/types-cryptoassets";
import {
  findCryptoCurrencyByTicker,
  findFiatCurrencyByTicker,
  findTokenByTicker,
} from "@ledgerhq/cryptoassets/index";

export { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
export { sanitizeValueString } from "./sanitizeValueString";
export { parseCurrencyUnit } from "./parseCurrencyUnit";
export { formatCurrencyUnit, formatCurrencyUnitFragment } from "./formatCurrencyUnit";
export { toLocaleString } from "./BigNumberToLocaleString";
export * from "./support";

export const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  findTokenByTicker(ticker);
