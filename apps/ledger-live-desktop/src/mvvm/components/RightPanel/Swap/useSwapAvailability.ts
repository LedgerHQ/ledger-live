import { useTradeAvailability } from "@ledgerhq/asset-detail";
import { useAssetRouteLedgerIds } from "LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds";
import { useAccountSwapConsole } from "LLD/features/AccountDetail/components/Hero/useAccountSwapConsole";
import { useAccountFromRouteParams } from "LLD/features/AccountDetail/hooks/useRouteAccount";
import { matchAccountRoute } from "LLD/features/AccountDetail/utils/matchAccountRoute";
import { getSwapRouteAssetId } from "./useSwapViewModel";

export const useSwapAvailability = (pathname: string): boolean => {
  const routeAssetId = getSwapRouteAssetId(pathname);
  const { ledgerIds, isLoading } = useAssetRouteLedgerIds(routeAssetId);
  const { availableOnSwap, isResolved } = useTradeAvailability(ledgerIds);
  const { mainAccount } = useAccountFromRouteParams(matchAccountRoute(pathname));
  const accountSwapConsole = useAccountSwapConsole(mainAccount);

  if (accountSwapConsole !== undefined) return accountSwapConsole;
  if (!routeAssetId) return true;
  // Show while loading to avoid a layout flicker; gate only once availability is known.
  if (isLoading || !isResolved) return true;
  return availableOnSwap;
};
