import type { LedgerAssetPath } from "@ledgerhq/asset-detail";
import type { AssetDetailMarketState } from "LLM/features/AssetDetail/types";

/**
 * Outcome of a resolved `market`/`asset` deeplink, shared by both hostnames so the routing decision
 * lives in one tested place:
 * - `asset-detail`: Wallet 4.0 is on → open Asset Detail (token deeplinks carry `marketState`).
 * - `legacy-currency`: Wallet 4.0 is off and the path is a coin → open the legacy screen.
 * - `reject`: Wallet 4.0 is off and the path is a token → not supported, caller falls back.
 */
export type ResolvedAssetDeeplinkAction =
  | { kind: "asset-detail"; currencyId: string; marketState?: AssetDetailMarketState }
  | { kind: "legacy-currency"; currencyId: string }
  | { kind: "reject" };

export function resolveAssetDeeplinkAction(
  asset: LedgerAssetPath,
  shouldDisplayAggregatedAssets: boolean,
): ResolvedAssetDeeplinkAction {
  const { currencyId, assetId, ledgerIds } = asset;

  if (ledgerIds && !shouldDisplayAggregatedAssets) {
    return { kind: "reject" };
  }

  if (shouldDisplayAggregatedAssets) {
    return {
      kind: "asset-detail",
      currencyId: assetId,
      marketState: ledgerIds ? { id: assetId, ledgerIds } : undefined,
    };
  }

  return { kind: "legacy-currency", currencyId };
}
