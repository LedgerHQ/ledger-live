import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "~/reducers/accounts";
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
import type { AptosRestakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AptosRestakingFlowParamList, ScreenName.AptosRestakingValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
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
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <TrackScreen
        category="AptosRestaking"
        name="ValidationSuccess"
        flow="stake"
        action="restaking"
        currency="aptos"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="aptos.restaking.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="aptos.staking.flow.steps.verification.success.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
