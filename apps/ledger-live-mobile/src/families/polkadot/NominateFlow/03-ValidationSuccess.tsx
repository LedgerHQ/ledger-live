import React, { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
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
import { PolkadotNominateFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = BaseComposite<
  StackNavigatorProps<PolkadotNominateFlowParamList, ScreenName.PolkadotNominateValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const transaction = route.params.transaction;
  const preloaded = usePolkadotPreloadData();
  const { validators: allValidators } = preloaded;
  const validators = useMemo(() => {
    return allValidators
      .filter(val => transaction?.validators?.includes(val.address))
      .map(val => val.identity || val.address);
  }, [allValidators, transaction?.validators]);
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: "DOT",
      validator: validators,
      source,
      delegation: "nomination",
      flow: "stake",
    });
  }, [source, validators]);

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
        category="NominateFlow"
        name="ValidationSuccess"
        flow="stake"
        action="nomination"
        currency="dot"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={<Trans i18nKey="polkadot.nominate.steps.validation.success.title" />}
        description={<Trans i18nKey="polkadot.nominate.steps.validation.success.description" />}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
