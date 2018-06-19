//@flow
import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
import type { Currency } from "../../types";

import { sanitizeValueString } from "./sanitizeValueString";

import {
  listFiatCurrencies,
  findFiatCurrencyByTicker,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker
} from "../../data/fiat";

import {
  listCryptoCurrencies,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  findCryptoCurrencyById,
  findCryptoCurrencyByScheme,
  findCryptoCurrencyByTicker
} from "../../data/cryptocurrencies";

import { parseCurrencyUnit } from "./parseCurrencyUnit";

import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";

import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment
} from "./formatCurrencyUnit";

import { formatShort } from "./formatShort";

import { valueFromUnit } from "./valueFromUnit";

const findCurrencyByTicker = (ticker: string): ?Currency =>
  findCryptoCurrencyByTicker(ticker) || findFiatCurrencyByTicker(ticker);

export {
  listFiatCurrencies,
  listCryptoCurrencies,
  getFiatCurrencyByTicker,
  findCurrencyByTicker,
  findCryptoCurrencyById,
  findCryptoCurrencyByTicker,
  findCryptoCurrencyByScheme,
  findFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
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
