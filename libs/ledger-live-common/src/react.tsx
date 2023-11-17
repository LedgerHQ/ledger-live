import React from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as icons from "@ledgerhq/crypto-icons-ui/react";
import { inferCryptoCurrencyIcon } from "./currencies/cryptoIcons";

type Icon = React.ComponentType<{
  size: number;
  color?: string;
}>;

const polyfillMappingCache = new WeakMap<Icon, Icon>();
/**
 * thin wrapper from the crypto-icons lib to the format expected by ledger-live-common
 * @deprecated prefer using @ledgerhq/crypto-icons-ui directly + mapping provided by @ledgerhq/live-common/currencies/cryptoIcons
 */
function polyfillIconComponent(IconComponent: Icon | null | undefined): Icon | null | undefined {
  if (!IconComponent) return IconComponent;
  if (polyfillMappingCache.has(IconComponent)) return polyfillMappingCache.get(IconComponent);
  const PolyfillIconComponent = (props: { size: number; color?: string }) =>
    props.color === undefined ? (
      // in the previous behavior, we were fallbacking on "currentColor"
      // if you need this behavior, it will be preferrable to explicit set it. as we will drop this polyfill implementation.
      <IconComponent {...props} color="currentColor" />
    ) : (
      <IconComponent {...props} />
    );
  polyfillMappingCache.set(IconComponent, PolyfillIconComponent);
  return PolyfillIconComponent;
}

/**
 * @deprecated prefer using @ledgerhq/crypto-icons-ui directly + mapping provided by @ledgerhq/live-common/currencies/cryptoIcons
 */
export function getCryptoCurrencyIcon(currency: CryptoCurrency): Icon | null | undefined {
  return polyfillIconComponent(inferCryptoCurrencyIcon(icons, currency));
}

/**
 * @deprecated prefer using @ledgerhq/crypto-icons-ui directly + mapping provided by @ledgerhq/live-common/currencies/cryptoIcons
 */
export function getTokenCurrencyIcon(token: TokenCurrency): Icon | null | undefined {
  return polyfillIconComponent(inferCryptoCurrencyIcon(icons, token));
}
