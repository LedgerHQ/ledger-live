import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { TrackScreen, track } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { AleoClaimUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoClaimUnbondFlowParamList, ScreenName.AleoClaimUnbondValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: route.params.accountId,
      operation: route.params.result,
    });
  }, [navigation, route.params]);

  const staker = route.params.transaction.recipient;
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      staker,
      source,
      delegation: "claiming",
      flow: "claim",
    });
  }, [ticker, staker, source]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background.main }]}>
      <TrackScreen
        category="ClaimUnbondFlow"
        name="ValidationSuccess"
        flow="claim"
        action="claiming"
        currency="aleo"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={<Trans i18nKey="aleo.claim.validation.success.title" />}
        description={<Trans i18nKey="aleo.claim.validation.success.description" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
