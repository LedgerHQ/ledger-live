import React, { useLayoutEffect } from "react";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import { ScreenName } from "~/const";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";
import { AssetCoinOptionsTrailing } from "./components/CoinOptions/AssetCoinOptionsTrailing";

type NavigationProps = NativeStackNavigationProp<
  AssetDetailNavigatorParamsList,
  ScreenName.AssetDetail
>;

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  const { header, coinOptions, shouldRedirectToMarket } = viewModel;
  const navigation = useNavigation<NavigationProps>();

  useLayoutEffect(() => {
    if (!header.ticker && !header.ledgerId) return;

    function renderTrailing(_props: NativeStackHeaderRightProps) {
      return (
        <AssetCoinOptionsTrailing
          onPress={coinOptions.openCoinOptions}
          accessibilityLabel={coinOptions.trailingAccessibilityLabel}
          testID={ASSET_DETAIL_TEST_IDS.coinOptionsTrailing}
        />
      );
    }

    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        coinCapsule: {
          ticker: header.ticker,
          leadingContent: header.ledgerId ? (
            <CryptoIcon
              ledgerId={header.ledgerId}
              ticker={header.ticker}
              size={24}
              testID={`${ASSET_DETAIL_TEST_IDS.coinCapsuleIcon}-${header.ticker}`}
            />
          ) : undefined,
          testID: ASSET_DETAIL_TEST_IDS.coinCapsule,
        },
        renderTrailing,
        navBarTrailingProps: {
          style: { marginRight: 16 },
        },
      },
    };
    navigation.setOptions(opts);
  }, [
    navigation,
    header.ticker,
    header.ledgerId,
    coinOptions.openCoinOptions,
    coinOptions.trailingAccessibilityLabel,
  ]);

  if (shouldRedirectToMarket) return null;

  return <AssetDetailView {...viewModel} />;
}
