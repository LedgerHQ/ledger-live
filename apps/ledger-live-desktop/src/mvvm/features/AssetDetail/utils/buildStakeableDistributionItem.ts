import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { DistributionItem } from "@ledgerhq/types-live";

/** Minimal distribution item for stakeable assets the user does not hold yet. */
export function buildStakeableDistributionItem(currency: CryptoOrTokenCurrency): DistributionItem {
  return {
    currency,
    amount: 0,
    distribution: 0,
    accounts: [],
  };
}
