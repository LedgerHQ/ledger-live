/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { Operation } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  result: Operation,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
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

  const mode = route.params.transaction.mode;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="CosmosClaimRewards" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={goToOperationDetails}
        title={
          <Trans
            i18nKey={`cosmos.claimRewards.flow.steps.verification.success.title${
              mode !== "claimReward" ? "Compound" : ""
            }`}
          />
        }
        description={
          <Trans i18nKey="cosmos.claimRewards.flow.steps.verification.success.text" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
