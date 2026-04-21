import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getStakeDescriptor } from "../registry";
import type { StakeDescriptor, StakeMode } from "../types";

function fromDescriptor<T>(
  getter: (d: StakeDescriptor) => T | undefined | null,
  fallback: T,
): (currency: CryptoOrTokenCurrency | undefined) => T {
  return currency => {
    const d = getStakeDescriptor(currency);
    return d ? (getter(d) ?? fallback) : fallback;
  };
}

export const stakeFeatures = {
  supportsStaking: (currency: CryptoOrTokenCurrency | undefined): boolean =>
    getStakeDescriptor(currency) !== null,

  getSupportedModes: fromDescriptor(d => d.supportedModes, [] as readonly StakeMode[]),

  supportsMode:
    (currency: CryptoOrTokenCurrency | undefined) =>
    (mode: StakeMode): boolean =>
      (getStakeDescriptor(currency)?.supportedModes ?? []).includes(mode),

  /**
   * Returns true when the coin uses a family-specific (custom) staking UI,
   * meaning the generic staking components should NOT be rendered.
   */
  hasCustomUI: fromDescriptor(d => d.customUI, false),

  /**
   * Returns true when the coin supports staking AND uses the generic UI
   * (i.e. does NOT have a custom UI).
   */
  usesGenericStakingUI: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const d = getStakeDescriptor(currency);
    return d !== null && !d.customUI;
  },
};
