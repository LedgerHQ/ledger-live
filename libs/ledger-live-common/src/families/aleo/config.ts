import { aleoDefaults } from "@ledgerhq/coin-aleo/config";
import type { AleoCoinConfig } from "@ledgerhq/coin-aleo/types";
import { currencyDefaultsToLiveConfig, getCurrencyConfiguration } from "../../config";

export { LIVE_BLOCK_HEIGHT_POLL_MS, MAX_UNBONDING_SYNC_ATTEMPTS } from "@ledgerhq/coin-aleo/config";

export const aleoConfig = currencyDefaultsToLiveConfig(aleoDefaults);

/** `undefined` until the configuration is loaded: LiveConfig throws for an unknown currency. */
export function getAleoCurrencyConfigById(currencyId: string): AleoCoinConfig | undefined {
  try {
    return getCurrencyConfiguration<AleoCoinConfig>(currencyId);
  } catch {
    return undefined;
  }
}
