import { useMemo } from "react";
import {
  resolveDistributionItem,
  type MarketStateSlice,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
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

const buildSwapWebViewKey = (currencyId?: string, accountId?: string): string =>
  `${currencyId ?? "none"}::${accountId ?? "none"}`;

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
  readonly marketState?: MarketStateSlice;
}

export const useRightPanelRouteCurrency = (
  routeAssetId: string | undefined,
  marketState?: MarketStateSlice,
) => {
  const distribution = useDistribution({ groupBy: "asset" });
  return useMemo(() => {
    if (!routeAssetId) return undefined;
    const decodedAssetId = decodeRouteParam(routeAssetId).toLowerCase();
    // Resolve the route asset the same robust way the asset-detail page does: prefer the
    // portfolio distribution (held assets, widened by the market-state hint), then fall back
    // to the currency registry.
    return (
      resolveDistributionItem({ routeAssetId, decodedAssetId, marketState, distribution })
        ?.currency ?? findCryptoCurrencyById(marketState?.ledgerIds?.[0] ?? decodedAssetId)
    );
  }, [routeAssetId, marketState, distribution]);
};

export const useRightPanelViewModel = ({
  pathname,
  routeAssetId,
  marketState,
}: UseRightPanelViewModelParams): RightPanelViewModel => {
  const allAccounts = useSelector(accountsSelector);

  const currency = useRightPanelRouteCurrency(routeAssetId, marketState);

  const initialSwapState = useMemo(() => {
    if (!currency) return undefined;

    const availableAccounts = getAvailableAccountsById(currency.id, flattenAccounts(allAccounts));
    const preselectedAccount = availableAccounts[0];
    if (!preselectedAccount) return undefined;

    const parentAccount = isTokenAccount(preselectedAccount)
      ? allAccounts.find(a => a.id === preselectedAccount.parentId)
      : undefined;

    return buildSwapNavigationState({
      defaultCurrency: currency,
      fromPath: pathname,
      account: preselectedAccount,
      parentAccount,
    });
  }, [currency, pathname, allAccounts]);

  const webviewKey = useMemo(
    () => buildSwapWebViewKey(currency?.id, initialSwapState?.defaultAccountId),
    [currency, initialSwapState],
  );

  return {
    initialSwapState,
    webviewKey,
  };
};
