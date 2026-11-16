import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { CantonCoinConfig, CantonContext } from "../config";

// logic/ calls `context.config()` without an id, so pin it to the account's currency.
export const getCurrencyContext = (
  context: CantonContext,
  currency: CryptoCurrency,
): CantonContext => ({
  ...context,
  config: () => context.config(currency.id),
});

export const pinConfig = (context: CantonContext, config: CantonCoinConfig): CantonContext => ({
  ...context,
  config: () => Promise.resolve(config),
});
