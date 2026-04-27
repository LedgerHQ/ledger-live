import { useMemo } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useRoute } from "@react-navigation/native";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { AssetDetailNavigatorParamsList } from "../../types";

type Route = StackNavigatorProps<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>["route"];

export function useAssetDetailViewModel() {
  const route = useRoute<Route>();
  const { currencyId, source } = route.params;

  const currency = useMemo(() => findCryptoCurrencyById(currencyId), [currencyId]);

  return {
    currency,
    source,
  };
}
