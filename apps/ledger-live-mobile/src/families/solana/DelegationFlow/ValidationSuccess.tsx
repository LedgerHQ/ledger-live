import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import invariant from "invariant";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { TrackScreen, track } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { SolanaDelegationFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getTrackingDelegationType } from "../../helpers";

type Props = BaseComposite<
  StackNavigatorProps<SolanaDelegationFlowParamList, ScreenName.DelegationValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const validator = route.params.validatorName ?? "unknown";
  const source = route.params.source?.name ?? "unknown";
  const delegation = getTrackingDelegationType({
    type: route.params.result.type,
  });
  const { ticker } = getAccountCurrency(account);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  useEffect(() => {
    if (delegation)
      track("staking_completed", {
        currency: ticker,
        validator,
        source,
        delegation,
        flow: "stake",
      });
  }, [source, validator, delegation, ticker]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;

    const result = route.params?.result;
    if (!result) return;

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  const transaction = route.params.transaction;
  invariant(transaction.family === "solana", "solana tx expected");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="SendFunds"
        name="ValidationSuccess"
        flow="stake"
        action="delegation"
        currency="sol"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey={"solana.delegation.broadcastSuccessTitle"} />}
        description={<Trans i18nKey={"solana.delegation.broadcastSuccessDescription"} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
});
