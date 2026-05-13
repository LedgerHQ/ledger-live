import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { Trans } from "~/context/Locale";
import { ScreenName } from "~/const";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { EvmUndelegationFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<EvmUndelegationFlowParamList, ScreenName.EvmUndelegationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const ticker = account ? getAccountCurrency(account).ticker : undefined;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account || !route.params.result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: route.params.result,
    });
  }, [account, navigation, route.params.result]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="EvmUndelegation"
        name="ValidationSuccess"
        flow="stake"
        action="undelegation"
        currency={ticker}
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="evm.undelegation.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="evm.undelegation.flow.steps.verification.success.text" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
