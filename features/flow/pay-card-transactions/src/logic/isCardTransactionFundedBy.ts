import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import type { CardTransactionItem } from "../types";

/**
 * Whether the card drew on one asset to settle a transaction.
 *
 * `PayCardTransactionFundingSourceSchema` keeps `currency`, `amount` and `sign` — the provider's
 * `network` is dropped before a transaction is cached — so the provider's asset code is the only
 * join available. A transaction funded by two assets has two funding sources, so it is listed under
 * each of them.
 *
 * An unknown `currency.network` pair, or a ticker the catalog does not cover, matches nothing.
 * A ticker-only `?asset=USDC` is resolved as `usdc.usdc`, which the catalog already lists.
 */
export function isCardTransactionFundedBy(
  item: CardTransactionItem,
  assetCode: string,
  network?: string,
): boolean {
  return (
    baanxAssetLedgerId(assetCode, network || assetCode) !== undefined &&
    (item.transaction.fundingSources?.some(
      source => source.currency.toUpperCase() === assetCode.toUpperCase(),
    ) ??
      false)
  );
}
