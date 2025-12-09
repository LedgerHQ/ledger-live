import React, { useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
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
import type { HederaClaimRewardsFlowParamList } from "./types";
import { getTrackingDelegationType } from "../../helpers";
import { useAccountScreen } from "~/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<
    HederaClaimRewardsFlowParamList,
    ScreenName.HederaClaimRewardsValidationSuccess
  >
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);

  const transaction = route.params.transaction;
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
      track("claim_rewards_completed", {
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
        category="ClaimRewardsFlow"
        name="ValidationSuccess"
        flow="stake"
        action="ClaimRewards"
        currency="hedera"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="hedera.claimRewards.steps.confirmation.success.title" />}
        description={<Trans i18nKey="hedera.claimRewards.steps.confirmation.success.description" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
