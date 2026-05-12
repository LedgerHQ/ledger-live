import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CurrencyIcon from "~/components/CurrencyIcon";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import { ScreenName } from "~/const";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";

type NavigationProps = NativeStackNavigationProp<
  AssetDetailNavigatorParamsList,
  ScreenName.AssetDetail
>;

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  const { currency } = viewModel;
  const navigation = useNavigation<NavigationProps>();

  useLayoutEffect(() => {
    if (!currency) return;
    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        coinCapsule: {
          ticker: currency.ticker,
          icon: <CurrencyIcon currency={currency} hideNetwork size={24} />,
        },
      },
    };
    navigation.setOptions(opts);
  }, [navigation, currency]);

  return <AssetDetailView {...viewModel} />;
}
