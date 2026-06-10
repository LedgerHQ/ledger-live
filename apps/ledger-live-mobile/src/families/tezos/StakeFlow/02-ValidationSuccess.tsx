import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "~/context/Locale";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { TrackScreen, track } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { TezosStakeFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<TezosStakeFlowParamList, ScreenName.TezosStakeValidationSuccess>
>;

export default function ValidationSuccess() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const transaction = route.params.transaction;
  const source = route.params.source?.name ?? "unknown";

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

  useEffect(() => {
    track("staking_completed", {
      currency: "XTZ",
      source,
      delegation: transaction.mode,
      flow: "stake",
    });
  }, [source, transaction.mode]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="TezosStakeFlow"
        name="ValidationSuccess"
        flow="stake"
        action="stake"
        currency="xtz"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="tezos.stake.flow.steps.confirmation.success.title" />}
        description={<Trans i18nKey="tezos.stake.flow.steps.confirmation.success.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
