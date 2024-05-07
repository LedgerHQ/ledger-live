import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import { sanitizeValueString } from "./sanitizeValueString";
export * from "./support";
import { parseCurrencyUnit } from "./parseCurrencyUnit";
import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";
import { formatCurrencyUnit, formatCurrencyUnitFragment } from "./formatCurrencyUnit";
import { formatShort } from "./formatShort";
import { valueFromUnit } from "./valueFromUnit";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import {
  findCryptoCurrencyByTicker,
  findFiatCurrencyByTicker,
  findTokenByTicker,
} from "@ledgerhq/cryptoassets/index";

const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  findTokenByTicker(ticker);

export {
  findCurrencyByTicker,
  parseCurrencyUnit,
  chopCurrencyUnitDecimals,
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  formatShort,
  encodeURIScheme,
  decodeURIScheme,
  valueFromUnit,
  sanitizeValueString,
};
