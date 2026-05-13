import { useCallback, useState } from "react";
import { useCurrencyById } from "@ledgerhq/cryptoassets/hooks";
import { useRoute } from "@react-navigation/native";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
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

  return {
    currency,
    source,
    isRefreshing,
    onRefresh,
    hasFooter,
    hideReceiveInBalanceGraph,
  };
}
