import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useBaker } from "@ledgerhq/live-common/families/tezos/bakers";
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
import type { TezosDelegationFlowParamList } from "./types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.DelegationValidationSuccess>
>;
export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const transaction = route.params.transaction;
  const baker = useBaker(transaction.recipient);
  const validator = baker?.name || transaction.recipient || "unknown";
  const source = route.params.source?.name ?? "unknown";
  const delegation = transaction.mode;

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
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey={"delegation.broadcastSuccessTitle." + transaction.mode} />}
        description={
          <Trans i18nKey={"delegation.broadcastSuccessDescription." + transaction.mode} />
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
    marginTop: 24,
  },
});
