import { useMemo } from "react";
import { resolveDistributionItem } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useDistribution } from "~/renderer/actions/general";
import { decodeRouteParam } from "LLD/features/AssetDetail/utils/decodeRouteParam";
import {
  buildSwapNavigationState,
  type SwapNavigationState,
} from "LLD/features/Market/utils/swapNavigation";
import type { RightPanelViewModel } from "./types";

const ASSET_PATH_PREFIX = "/asset/";

const buildSwapWebViewKey = (initialSwapState?: SwapNavigationState): string =>
  `${initialSwapState?.defaultCurrency?.toCurrencyId ?? "none"}::${initialSwapState?.defaultAccountId ?? "none"}`;

export const DEFAULT_RIGHT_PANEL_VIEW_MODEL: RightPanelViewModel = {
  initialSwapState: undefined,
  webviewKey: "none::none",
};

export const getRightPanelRouteAssetId = (pathname: string): string | undefined => {
  if (!pathname.startsWith(ASSET_PATH_PREFIX)) return undefined;
  const routeAssetId = pathname.slice(ASSET_PATH_PREFIX.length);
  return routeAssetId || undefined;
};

interface UseRightPanelViewModelParams {
  readonly pathname: string;
  readonly routeAssetId: string;
}

export const useRightPanelViewModel = ({
  pathname,
  routeAssetId,
}: UseRightPanelViewModelParams): RightPanelViewModel => {
  const distribution = useDistribution({ groupBy: "asset" });
  const allAccounts = useSelector(accountsSelector);

  const currency = useMemo(() => {
    const decodedAssetId = decodeRouteParam(routeAssetId);
    return resolveDistributionItem({ routeAssetId, decodedAssetId, distribution })?.currency;
  }, [routeAssetId, distribution]);

  const initialSwapState = useMemo(() => {
    if (!currency) return undefined;

    const availableAccounts = getAvailableAccountsById(currency.id, flattenAccounts(allAccounts));
    const preselectedAccount = availableAccounts[0];
    const parentAccount =
      preselectedAccount && isTokenAccount(preselectedAccount)
        ? allAccounts.find(a => a.id === preselectedAccount.parentId)
        : undefined;

    return buildSwapNavigationState({
      defaultCurrency: currency,
      fromPath: pathname,
      account: preselectedAccount,
      parentAccount,
    });
  }, [currency, pathname, allAccounts]);

  const webviewKey = useMemo(() => buildSwapWebViewKey(initialSwapState), [initialSwapState]);

  return {
    initialSwapState,
    webviewKey,
  };
};
