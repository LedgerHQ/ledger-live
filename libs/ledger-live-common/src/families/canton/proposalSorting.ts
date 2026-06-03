import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";

/**
 * Resolve a Canton proposal's instrument_id back to its display Unit
 * (token ticker + magnitude). The parent account's sub-accounts already
 * carry per-token pending proposals after sync, so we build the lookup
 * from there; anything unknown falls back to the parent currency's unit.
 */
export const buildUnitResolver = (parentAccount: Account): ((instrumentId: string) => Unit) => {
  const unitByInstrumentId = new Map<string, Unit>();
  for (const sub of parentAccount.subAccounts ?? []) {
    if (sub.type !== "TokenAccount") continue;
    const subProposals =
      (sub as { cantonResources?: { pendingTransferProposals?: Array<{ instrument_id: string }> } })
        .cantonResources?.pendingTransferProposals ?? [];
    for (const p of subProposals) {
      unitByInstrumentId.set(p.instrument_id, sub.token.units[0]);
    }
  }
  const fallback = parentAccount.currency.units[0];
  return (instrumentId: string) => unitByInstrumentId.get(instrumentId) ?? fallback;
};

/**
 * Comparator for the pending-offers list: group offers of the same token
 * together (alphabetical by instrumentId), and within a token put the
 * soonest-expiring on top.
 */
export const byTokenAndDate = <T extends { instrumentId: string; expiresAtMicros: number }>(
  a: T,
  b: T,
): number =>
  a.instrumentId === b.instrumentId
    ? a.expiresAtMicros - b.expiresAtMicros
    : a.instrumentId.localeCompare(b.instrumentId);
