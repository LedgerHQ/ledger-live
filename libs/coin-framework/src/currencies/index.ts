import type { Currency } from "@ledgerhq/types-cryptoassets";
import {
  findCryptoCurrencyByTicker,
  findFiatCurrencyByTicker,
  findTokenByTicker,
} from "@ledgerhq/cryptoassets/index";
import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import { sanitizeValueString } from "./sanitizeValueString";
export * from "./support";
import { parseCurrencyUnit } from "./parseCurrencyUnit";
import { formatCurrencyUnit, formatCurrencyUnitFragment } from "./formatCurrencyUnit";
import { valueFromUnit } from "./valueFromUnit";

const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  findTokenByTicker(ticker);

export {
  findCurrencyByTicker,
  parseCurrencyUnit,
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  encodeURIScheme,
  decodeURIScheme,
  valueFromUnit,
  sanitizeValueString,
};
