import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import camelCase from "lodash/camelCase";
import * as icons from "./data/icons/react";
import * as flags from "./data/flags/react";
type Icon = React.ComponentType<{
  size: number;
  color?: string;
}>;

function getCurrencyIconId({ id }: CryptoCurrency) {
  return camelCase(`currency_${id}`);
}

function getTickerIconId({ ticker }: CryptoCurrency | TokenCurrency) {
  let id = ticker.toLowerCase();
  if (!isNaN(parseInt(id.charAt(0), 10))) id = `_${id}`; // fix variable name leading with a numerical value

  return id;
}

export function getCryptoCurrencyIcon(
  currency: CryptoCurrency
): Icon | null | undefined {
  return icons[getCurrencyIconId(currency)] || icons[getTickerIconId(currency)];
}
export function getTokenCurrencyIcon(
  token: TokenCurrency
): Icon | null | undefined {
  return token.disableCountervalue ? null : icons[getTickerIconId(token)];
}
export function getFlag(countryCode: string): Icon | undefined {
  return flags[`${countryCode.toLowerCase()}Flag`];
}
