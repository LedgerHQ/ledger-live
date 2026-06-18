import { useTradeAvailability } from "@ledgerhq/asset-detail";
import { useAssetRouteLedgerIds } from "LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds";
import { getRightPanelRouteAssetId } from "./useRightPanelViewModel";

export const useRightPanelSwapAvailability = (pathname: string): boolean => {
  const routeAssetId = getRightPanelRouteAssetId(pathname);
  const { ledgerIds, isLoading } = useAssetRouteLedgerIds(routeAssetId);
  const { availableOnSwap, isResolved } = useTradeAvailability(ledgerIds);

  if (!routeAssetId) return true;
  // Show while loading to avoid a layout flicker; gate only once availability is known.
  if (isLoading || !isResolved) return true;
  return availableOnSwap;
};
