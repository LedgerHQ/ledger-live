import React, { useCallback, useLayoutEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import { HISTORY_TAB_CARD } from "LLM/features/OperationsHistory/constants";
import { OperationsListView } from "./OperationsListView";
import { OperationsHistoryOptionsTrailing } from "./components/OperationsHistoryOptionsTrailing";
import { useCardHistoryViewModel } from "./components/useCardHistoryViewModel";
import { useOperationsListViewModel } from "./useOperationsListViewModel";

type Props = StackNavigatorProps<OperationsHistoryNavigatorParamsList, ScreenName.OperationsList>;

export default function OperationsList({ route, navigation }: Props) {
  const { bottom } = useSafeAreaInsets();
  const accountIds = route.params?.accountIds;
  const viewModel = useOperationsListViewModel(accountIds, route.params?.historyTab);
  const cardHistoryViewModel = useCardHistoryViewModel(navigation);
  const isCardTab = viewModel.showHistoryTypeSwitcher && viewModel.historyTab === HISTORY_TAB_CARD;
  const showDustFilter = viewModel.isDustFilterFeatureEnabled && !isCardTab;

  const renderTrailing = useCallback(
    (_props: NativeStackHeaderRightProps) => (
      <OperationsHistoryOptionsTrailing onPress={viewModel.openOptionsSheet} />
    ),
    [viewModel.openOptionsSheet],
  );

  useLayoutEffect(() => {
    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        renderTrailing: showDustFilter ? renderTrailing : undefined,
        navBarTrailingProps: showDustFilter
          ? {
              style: { marginRight: 16 },
            }
          : undefined,
      },
    };

    navigation.setOptions(opts);
  }, [navigation, renderTrailing, showDustFilter]);

  return (
    <OperationsListView
      viewModel={viewModel}
      cardHistoryViewModel={cardHistoryViewModel}
      bottomInset={bottom}
    />
  );
}
