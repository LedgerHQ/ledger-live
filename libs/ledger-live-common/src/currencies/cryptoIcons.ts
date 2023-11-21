// logic that infer a crypto icons slug from a currency

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import camelCase from "lodash/camelCase";

export function inferCryptoCurrencyIcon<Icon>(
  iconsRegistry: Record<string, Icon>,
  currency: CryptoCurrency | TokenCurrency,
): Icon | null | undefined {
  // FIXME ongoing hack due to ticker collision
  if (currency.disableCountervalue) return null;
  // we allow the icons to define a currency_{id} format
  const maybeIconById = iconsRegistry[camelCase(`currency_${currency.id}`).toUpperCase()];
  if (maybeIconById) return maybeIconById;
  // otherwise we fallback by a token lookup
  let id = currency.ticker.toUpperCase();
  if (!isNaN(parseInt(id.charAt(0), 10))) id = `_${id}`; // fix variable name leading with a numerical value
  return iconsRegistry[id];
}
