// logic that infer a crypto icons slug from a currency

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function inferCryptoCurrencyIcon<Icon>(
  iconsRegistry: Record<string, Icon>,
  currency: CryptoCurrency | TokenCurrency,
): Icon | null | undefined {
  if (currency.type === "TokenCurrency") {
    // FIXME DEPRECATED (ongoing hack due to ticker collision)
    if (currency.disableCountervalue) return null;
  } else {
    // we allow the icons to define a CURRENCY_{id} format (check in libs/ui/crypto-icons compiled files, they get uppercased. we will improve in future)
    const maybeIconById = iconsRegistry[`currency_${currency.id}`.toUpperCase()];
    if (maybeIconById) return maybeIconById;
  }
  // otherwise we fallback by a token lookup
  let id = currency.ticker.toUpperCase();
  if (!isNaN(parseInt(id.charAt(0), 10))) id = `_${id}`; // fix variable name leading with a numerical value
  return iconsRegistry[id];
}
