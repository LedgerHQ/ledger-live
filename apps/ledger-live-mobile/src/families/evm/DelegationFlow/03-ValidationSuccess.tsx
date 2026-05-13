/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { TrackScreen, track } from "~/analytics";
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
import type { EvmDelegationFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const transaction = route.params.transaction as unknown as GenericTransaction;
  const validator = route.params.validatorName ?? transaction.valAddress ?? "unknown";
  const source = route.params.source?.name ?? "unknown";

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

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source,
      delegation: "delegation",
      flow: "stake",
    });
  }, [source, ticker, validator]);

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
