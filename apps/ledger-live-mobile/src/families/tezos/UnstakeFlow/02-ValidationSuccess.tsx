import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "~/context/Locale";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { TezosUnstakeFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<TezosUnstakeFlowParamList, ScreenName.TezosUnstakeValidationSuccess>
>;

export default function ValidationSuccess() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="TezosUnstakeFlow"
        name="ValidationSuccess"
        flow="stake"
        action="unstake"
        currency="xtz"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="tezos.unstake.flow.steps.confirmation.success.title" />}
        description={<Trans i18nKey="tezos.unstake.flow.steps.confirmation.success.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
