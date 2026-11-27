import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { pinConfig, type CantonContext } from "../config";

// logic/ and network/ call `context.config()` without an id, so pin it to the account's currency.
// Resolved once, so one operation sees one config.
export const getCurrencyContext = async (
  context: CantonContext,
  currency: CryptoCurrency,
): Promise<CantonContext> => pinConfig(context, await context.config(currency.id));
