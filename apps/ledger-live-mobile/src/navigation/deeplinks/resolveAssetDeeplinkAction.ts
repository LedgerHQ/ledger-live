import type { LedgerAssetPath } from "@ledgerhq/asset-detail";
import type { AssetDetailMarketState } from "LLM/features/AssetDetail/types";

export type ResolvedAssetDeeplinkAction = {
  kind: "asset-detail";
  currencyId: string;
  marketState?: AssetDetailMarketState;
};

export function resolveAssetDeeplinkAction(asset: LedgerAssetPath): ResolvedAssetDeeplinkAction {
  const { assetId, ledgerIds } = asset;

  return {
    kind: "asset-detail",
    currencyId: assetId,
    marketState: ledgerIds ? { id: assetId, ledgerIds } : undefined,
  };
}
