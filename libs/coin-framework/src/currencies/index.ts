import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import { sanitizeValueString } from "./sanitizeValueString";
import {
  listFiatCurrencies,
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
  listCryptoCurrencies,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  findCryptoCurrency,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByKeyword,
  findCryptoCurrencyByTicker,
  listTokens,
  listTokensForCryptoCurrency,
  listTokenTypesForCryptoCurrency,
  findTokenByTicker,
  findTokenById,
  findTokenByAddress,
  hasTokenId,
  getAbandonSeedAddress,
  getTokenById,
  addTokens,
} from "@ledgerhq/cryptoassets";
export * from "./support";
import { parseCurrencyUnit } from "./parseCurrencyUnit";
import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "./formatCurrencyUnit";
import { formatShort } from "./formatShort";
import { valueFromUnit } from "./valueFromUnit";
import type { Currency } from "@ledgerhq/types-cryptoassets";

const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  findTokenByTicker(ticker);

export {
  listFiatCurrencies,
  listCryptoCurrencies,
  getFiatCurrencyByTicker,
  findCurrencyByTicker,
  findCryptoCurrency,
  findCryptoCurrencyById,
  findCryptoCurrencyByTicker,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByKeyword,
  findFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
  listTokensForCryptoCurrency,
  listTokenTypesForCryptoCurrency,
  findTokenByAddress,
  findTokenByTicker,
  findTokenById,
  hasTokenId,
  getTokenById,
  getAbandonSeedAddress,
  parseCurrencyUnit,
  chopCurrencyUnitDecimals,
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  formatShort,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  encodeURIScheme,
  decodeURIScheme,
  valueFromUnit,
  sanitizeValueString,
  listTokens,
  addTokens,
};
