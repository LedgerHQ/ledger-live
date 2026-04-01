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
};
