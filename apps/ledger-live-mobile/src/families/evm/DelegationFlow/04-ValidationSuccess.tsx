import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
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
import type { EvmDelegationFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useNotifications } from "LLM/features/NotificationsPrompt";

type Props = BaseComposite<
  StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const validator = route.params.validatorName ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source: route.params.source?.name ?? "unknown",
      flow: "stake",
    });
    tryTriggerPushNotificationDrawerAfterAction("stake");
  }, [ticker, validator, route.params.source, tryTriggerPushNotificationDrawerAfterAction]);

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
        category="EvmDelegation"
        name="ValidationSuccess"
        flow="stake"
        action="delegation"
        currency={ticker}
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="evm.delegation.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="evm.delegation.flow.steps.verification.success.text" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
