// @flow
import * as icons from "./data/icons/react";
import * as flags from "./data/flags/react";
import type { CryptoCurrency, TokenCurrency } from "./types";

type Icon = React$ComponentType<{ size: number, color?: string }>;

function getIconId({ ticker }: CryptoCurrency | TokenCurrency) {
  let id = ticker.toLowerCase();
  if (!isNaN(id.charAt(0))) id = `_${id}`; // fix variable name leading with a numerical value

  return id;
}

export function getCryptoCurrencyIcon(currency: CryptoCurrency): ?Icon {
  return icons[getIconId(currency)];
}

export function getTokenCurrencyIcon(token: TokenCurrency): ?Icon {
  return token.disableCountervalue ? null : icons[getIconId(token)];
}

export function getFlag(countryCode: string): ?Icon {
  return flags[`${countryCode.toLowerCase()}Flag`];
}
