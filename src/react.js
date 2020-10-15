// @flow
import * as icons from "./data/icons/react";
import * as tokenIcons from "./data/icons/react/tokens";
import type { CryptoCurrency, TokenCurrency } from "./types";
import iconNameById from "./iconNameById";

type Icon = React$ComponentType<{ size: number, color?: string }>;

export function getCryptoCurrencyIcon(currency: CryptoCurrency): ?Icon {
  return icons[iconNameById(currency.id)];
}

export function getTokenCurrencyIcon(token: TokenCurrency): ?Icon {
  return tokenIcons[token.id.replace(/\//g, "_")];
}
