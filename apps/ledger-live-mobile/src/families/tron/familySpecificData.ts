import type {
  Transaction as TronTransaction,
  TronFamilySpecificData,
} from "@ledgerhq/live-common/families/tron/types";

/**
 * Builds the `familySpecificData` bag to hand to `bridge.updateTransaction`. The bridge shallow-
 * replaces top-level fields, so the current bag has to be spread or the keys the generic coin
 * framework seeded (`resource`, `duration`, `votes`) are dropped (ADR-047).
 */
export function mergeTronFamilySpecificData(
  transaction: Pick<TronTransaction, "familySpecificData"> | null | undefined,
  patch: TronFamilySpecificData,
): TronFamilySpecificData {
  return { ...transaction?.familySpecificData, ...patch };
}
