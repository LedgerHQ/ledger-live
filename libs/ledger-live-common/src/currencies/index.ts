import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import type { Currency } from "../types";
import { sanitizeValueString } from "./sanitizeValueString";
import {
  sortByMarketcap,
  getMarketcapTickers,
  useMarketcapTickers,
  currenciesByMarketcap,
  useCurrenciesByMarketcap,
} from "./sortByMarketcap";
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
  getTokenById,
  findCompoundToken,
  getAbandonSeedAddress,
} from "@ledgerhq/cryptoassets";
export * from "./support";
export * from "./helpers";
import { parseCurrencyUnit } from "./parseCurrencyUnit";
import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "./formatCurrencyUnit";
import { formatShort } from "./formatShort";
import { valueFromUnit } from "./valueFromUnit";
import { getCurrencyColor } from "./color";

const findCurrencyByTicker = (ticker: string): Currency | null | undefined =>
  findCryptoCurrencyByTicker(ticker) ||
  findFiatCurrencyByTicker(ticker) ||
  findTokenByTicker(ticker);

export {
  sortByMarketcap,
  getMarketcapTickers,
  useMarketcapTickers,
  currenciesByMarketcap,
  useCurrenciesByMarketcap,
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
  listTokens,
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
  getCurrencyColor,
  findCompoundToken,
};
