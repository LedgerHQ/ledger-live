import React, { useCallback, useLayoutEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import { OperationsListView } from "./OperationsListView";
import { OperationsHistoryOptionsTrailing } from "./components/OperationsHistoryOptionsTrailing";
import { useCardHistoryViewModel } from "./components/useCardHistoryViewModel";
import { useOperationsListViewModel } from "./useOperationsListViewModel";
import { useTranslation } from "~/context/Locale";

const NO_CURRENCY_IDS: readonly string[] = [];

type Props = StackNavigatorProps<OperationsHistoryNavigatorParamsList, ScreenName.OperationsList>;

export default function OperationsList({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const accountIds = route.params?.accountIds;
  const cardAsset = route.params?.asset;
  const cardAssetLedgerId = cardAsset ? baanxAssetLedgerId(cardAsset, cardAsset) : undefined;
  const currencies = useCurrenciesByIds(cardAssetLedgerId ? [cardAssetLedgerId] : NO_CURRENCY_IDS);
  const cardAssetName = cardAsset
    ? (cardAssetLedgerId && currencies.get(cardAssetLedgerId)?.name) || cardAsset.toUpperCase()
    : undefined;
  const cardScopeLabel = cardAssetName
    ? t("history.cardAssetScope", { assetName: cardAssetName })
    : undefined;
  const viewModel = useOperationsListViewModel(accountIds, route.params?.historyTab, cardAsset);
  const cardHistoryViewModel = useCardHistoryViewModel(navigation);
  const showDustFilter = viewModel.isDustFilterFeatureEnabled && !viewModel.isCardTab;

  const renderTrailing = useCallback(
    (_props: NativeStackHeaderRightProps) => (
      <OperationsHistoryOptionsTrailing onPress={viewModel.openOptionsSheet} />
    ),
    [viewModel.openOptionsSheet],
  );

  useLayoutEffect(() => {
    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        description: cardScopeLabel,
        navBarDescriptionProps: cardScopeLabel ? { testID: "card-history-asset-scope" } : undefined,
        renderTrailing: showDustFilter ? renderTrailing : undefined,
        navBarTrailingProps: showDustFilter
          ? {
              style: { marginRight: 16 },
            }
          : undefined,
      },
    };

    navigation.setOptions(opts);
  }, [cardScopeLabel, navigation, renderTrailing, showDustFilter]);

  return (
    <OperationsListView
      viewModel={viewModel}
      cardHistoryViewModel={cardHistoryViewModel}
      cardAsset={cardAsset}
      bottomInset={bottom}
    />
  );
}
