import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { BaseComposite, BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { PolkadotUnbondFlowParamList } from "./type";

type NavigationProps = BaseComposite<
  StackScreenProps<PolkadotUnbondFlowParamList, ScreenName.PolkadotUnbondValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const onClose = useCallback(() => {
    navigation.getParent<BaseNavigation>().pop();
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
        category="UnbondFlow"
        name="ValidationSuccess"
        flow="stake"
        action="withdraw_unbonded"
        currency="dot"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="polkadot.unbond.steps.validation.success.title" />}
        description={<Trans i18nKey="polkadot.unbond.steps.validation.success.description" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
