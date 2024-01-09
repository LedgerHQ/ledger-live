import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
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
import { PolkadotSimpleOperationFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    PolkadotSimpleOperationFlowParamList,
    ScreenName.PolkadotSimpleOperationValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);
  const { mode, result } = route.params || {};
  const goToOperationDetails = useCallback(() => {
    if (!account || !result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, result, navigation]);
  const action = mode.replace(/([A-Z])/g, "_$1").toLowerCase();
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
        category="SimpleOperationFlow"
        name="ValidationSuccess"
        flow="stake"
        action={action}
        currency="dot"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="polkadot.simpleOperation.steps.validation.success.title" />}
        description={
          <Trans i18nKey="polkadot.simpleOperation.steps.validation.success.description" />
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
