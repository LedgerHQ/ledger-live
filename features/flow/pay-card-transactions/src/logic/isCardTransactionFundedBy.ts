import { isBaanxAssetCurrency } from "@domain/entity-card-asset-mapping";
import type { CardTransactionItem } from "../types";

/**
 * Whether the card drew on the asset `ledgerId` names to settle a transaction.
 *
 * `PayCardTransactionFundingSourceSchema` keeps `currency`, `amount` and `sign` — the provider's
 * `network` is dropped before a transaction is cached — so the provider's asset code is the only
 * join available. A transaction funded by two assets has two funding sources, so it is listed under
 * each of them. A Ledger id the catalog does not cover matches nothing.
 */
export function isCardTransactionFundedBy(item: CardTransactionItem, ledgerId: string): boolean {
  return (
    item.transaction.fundingSources?.some(source =>
      isBaanxAssetCurrency(ledgerId, source.currency),
    ) ?? false
  );
}
