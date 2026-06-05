import React, { useCallback, useEffect } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { useBaker } from "@ledgerhq/live-common/families/tezos/react";
import { TrackScreen, track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import Button from "~/components/Button";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { TezosDelegationFlowParamList } from "./types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.DelegationValidationSuccess>
>;
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const transaction = route.params.transaction;
  const baker = useBaker(transaction.recipient);
  const validator = baker?.name || transaction.recipient || "unknown";
  const source = route.params.source?.name ?? "unknown";
  const delegation = transaction.mode;
  // After a fresh delegation, invite the user to chain straight into the stake flow.
  const stakeAfter = !!route.params.stakeAfter && transaction.mode === "delegate";

  useEffect(() => {
    track("staking_completed", {
      currency: "XTZ",
      validator,
      source,
      delegation,
      flow: "stake",
    });
  }, [delegation, source, validator]);

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      ...route.params,
      accountId: account.id,
      operation: result,
    });
  }, [account, route.params, navigation]);

  const learnMore = useCallback(() => Linking.openURL(urls.delegation), []);

  const goToStake = useCallback(() => {
    onClose();
    navigation.navigate(NavigatorName.TezosStakeFlow, {
      screen: ScreenName.TezosStakeAmount,
      params: {
        accountId: route.params.accountId,
        parentId: route.params.parentId,
        source: route.params.source,
      },
    });
  }, [onClose, navigation, route.params]);

  if (transaction.family !== "tezos") return null;
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
        category="SendFunds"
        name="ValidationSuccess"
        flow="stake"
        action="delegation"
        currency="xtz"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={stakeAfter ? undefined : goToOperationDetails}
        title={<Trans i18nKey={"delegation.broadcastSuccessTitle." + transaction.mode} />}
        description={
          <Trans i18nKey={"delegation.broadcastSuccessDescription." + transaction.mode} />
        }
        info={stakeAfter ? <Trans i18nKey="tezos.stake.flow.delegationSuccess.info" /> : undefined}
        onLearnMore={stakeAfter ? learnMore : undefined}
        primaryButton={
          stakeAfter ? (
            <Button
              event="TezosDelegationSuccessStake"
              type="main"
              title={<Trans i18nKey="tezos.stake.flow.delegationSuccess.cta" />}
              onPress={goToStake}
              containerStyle={styles.button}
            />
          ) : undefined
        }
        secondaryButton={
          stakeAfter ? (
            <Button
              event="TezosDelegationSuccessStakeLater"
              type="default"
              title={<Trans i18nKey="common.close" />}
              onPress={onClose}
              containerStyle={styles.button}
            />
          ) : undefined
        }
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
    marginTop: 16,
  },
});
