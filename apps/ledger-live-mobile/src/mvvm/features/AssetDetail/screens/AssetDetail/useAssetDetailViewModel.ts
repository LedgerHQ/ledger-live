import { useCallback, useMemo, useState } from "react";
import { useCurrencyById } from "@ledgerhq/cryptoassets/hooks";
import { useRoute } from "@react-navigation/native";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import type { AssetDetailNavigatorParamsList } from "../../types";
import { useIsBuyAvailable, useSecondaryButtonType } from "./components/Footer/useFooterViewModel";

type Route = StackNavigatorProps<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>["route"];

export function useAssetDetailViewModel() {
  const route = useRoute<Route>();
  const { currencyId, source } = route.params;

  const { currency } = useCurrencyById(currencyId);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  const isBuyAvailable = useIsBuyAvailable(currency);
  const secondaryButton = useSecondaryButtonType(currency);
  const hasFooter = isBuyAvailable || secondaryButton !== null;
  const hideReceiveInBalanceGraph = secondaryButton === "receive";

  const accounts = useSelector(shallowAccountsSelector);
  const walletHasFunds = useMemo(() => accounts.some(a => a.balance.gt(0)), [accounts]);
  const showFallbackBanner = !hasFooter && walletHasFunds && !!currency;

  return {
    currency,
    source,
    isRefreshing,
    onRefresh,
    hasFooter,
    hideReceiveInBalanceGraph,
    showFallbackBanner,
  };
}
