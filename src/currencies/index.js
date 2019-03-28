// @flow

import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import type { Currency } from "../types";

import { sanitizeValueString } from "./sanitizeValueString";

import {
  listFiatCurrencies,
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker
} from "../data/fiat";

import {
  listCryptoCurrencies,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  findCryptoCurrency,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker
} from "../data/cryptocurrencies";

import {
  listTokens,
  listTokensForCryptoCurrency,
  findTokenByTicker,
  findTokenById,
  findTokenByAddress,
  hasTokenId,
  getTokenById
} from "../data/tokens";

import { parseCurrencyUnit } from "./parseCurrencyUnit";

import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";

import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment
} from "./formatCurrencyUnit";

import { formatShort } from "./formatShort";

import { valueFromUnit } from "./valueFromUnit";

const findCurrencyByTicker = (ticker: string): ?Currency =>
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
  findFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
  listTokens,
  listTokensForCryptoCurrency,
  findTokenByAddress,
  findTokenByTicker,
  findTokenById,
  hasTokenId,
  getTokenById,
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
  sanitizeValueString
};
