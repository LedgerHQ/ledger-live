import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import {
  dismissStakePosition,
  settleStakePosition,
  type StakePositionExitAction,
} from "@features/flow-stake-position";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { SolanaStakePositionFlowParamList } from "./types";
import { useSettleOnceOperationAdded } from "./useSettleOnceOperationAdded";

type Props = BaseComposite<
  StackNavigatorProps<
    SolanaStakePositionFlowParamList,
    ScreenName.SolanaStakePositionValidationSuccess
  >
>;

const TITLE_KEYS = {
  deactivate: "stakePosition.result.deactivateTitle",
  withdraw: "stakePosition.result.withdrawTitle",
} as const satisfies Record<StakePositionExitAction, string>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { accountId, requestId, action, result } = route.params;

  useSettleOnceOperationAdded({ requestId, action, accountId, operation: result });

  const onClose = useCallback(() => {
    // Closing before the operation shows still answers: the broadcast succeeded.
    settleStakePosition(requestId, action);
    dismissStakePosition(requestId);
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation, requestId, action]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId, operation: result });
  }, [navigation, accountId, result]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={t(TITLE_KEYS[action])}
        description={t("stakePosition.result.description")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
