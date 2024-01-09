import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountScreenSelector } from "~/reducers/accounts";
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
import type { CosmosDelegationFlowParamList } from "./types";
import { getTrackingDelegationType } from "../../helpers";

type Props = BaseComposite<
  StackNavigatorProps<CosmosDelegationFlowParamList, ScreenName.CosmosDelegationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const validator = route.params.validatorName ?? "unknown";
  const source = route.params.source?.name ?? "unknown";
  const delegation = getTrackingDelegationType({
    type: route.params.result.type,
  });
  const { ticker } = getAccountCurrency(account);

  useEffect(() => {
    if (delegation)
      track("staking_completed", {
        currency: ticker,
        validator,
        source,
        delegation,
        flow: "stake",
      });
  }, [source, validator, delegation, ticker, account]);

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
        category="CosmosDelegation"
        name="ValidationSuccess"
        flow="stake"
        action="delegation"
        currency={ticker}
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="cosmos.delegation.flow.steps.verification.success.title" />}
        description={<Trans i18nKey="cosmos.delegation.flow.steps.verification.success.text" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
