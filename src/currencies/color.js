// @flow
import type { Currency } from "../types";

export const getCurrencyColor = (currency: Currency) =>
  currency.type === "CryptoCurrency" ? currency.color : "#777";
