import React, { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { isStakingTransaction } from "@ledgerhq/live-common/families/hedera/utils";
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
import { accountScreenSelector } from "~/reducers/accounts";
import type { HederaUndelegationFlowParamList } from "./types";
import { getTrackingDelegationType } from "../../helpers";

type Props = BaseComposite<
  StackNavigatorProps<
    HederaUndelegationFlowParamList,
    ScreenName.HederaUndelegationValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const transaction = route.params.transaction;
  invariant(account, "account must be defined");
  invariant(isStakingTransaction(transaction), "hedera: staking tx expected");

  const selectedValidatorNodeId = transaction.properties?.stakingNodeId ?? null;
  const source = route.params.source?.name ?? "unknown";
  const delegation = getTrackingDelegationType({ type: route.params.result.type });
  const { ticker } = getAccountCurrency(account);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  useEffect(() => {
    if (delegation)
      track("undelegation_completed", {
        currency: ticker,
        validator: selectedValidatorNodeId,
        source,
        delegation,
        flow: "stake",
      });
  }, [source, selectedValidatorNodeId, delegation, ticker]);

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
        category="UndelegationFlow"
        name="ValidationSuccess"
        flow="stake"
        action={HEDERA_TRANSACTION_MODES.Undelegate}
        currency="hedera"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="hedera.undelegation.steps.confirmation.success.title" />}
        description={<Trans i18nKey="hedera.undelegation.steps.confirmation.success.description" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
