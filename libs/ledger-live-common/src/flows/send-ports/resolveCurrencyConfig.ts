import { getCurrencyConfiguration } from "../../config";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { resolveRecipientNetworkId } from "@features/platform-send-flow";

export function resolveCurrencyConfig(currencyId: string | undefined): CurrencyConfig | undefined {
  if (currencyId === undefined) return undefined;
  try {
    return getCurrencyConfiguration<CurrencyConfig>(resolveRecipientNetworkId(currencyId));
  } catch (err) {
    console.warn(err);
    return undefined;
  }
}
