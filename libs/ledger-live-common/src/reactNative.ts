import React from "react";
import * as icons from "@ledgerhq/crypto-icons-ui/native";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { inferCryptoCurrencyIcon } from "./currencies/cryptoIcons";

type Icon = React.ComponentType<{
  size: number;
  color: string;
}>;

/**
 * @deprecated prefer using @ledgerhq/crypto-icons-ui directly + mapping provided by @ledgerhq/live-common/currencies/cryptoIcons
 */
export function getCryptoCurrencyIcon(currency: CryptoCurrency): Icon | null | undefined {
  return inferCryptoCurrencyIcon(icons, currency);
}

/**
 * @deprecated prefer using @ledgerhq/crypto-icons-ui directly + mapping provided by @ledgerhq/live-common/currencies/cryptoIcons
 */
export function getTokenCurrencyIcon(token: TokenCurrency): Icon | null | undefined {
  return inferCryptoCurrencyIcon(icons, token);
}
