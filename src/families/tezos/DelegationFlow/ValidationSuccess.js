/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type { Operation, Transaction } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import Button from "../../../components/Button";
import { urls } from "../../../config/urls";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: Transaction,
  result: Operation,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const goToAccount = useCallback(() => {
    if (!account) return;
    navigation.navigate(ScreenName.Account, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  }, [navigation, account, parentAccount]);

  const goToHelp = useCallback(() => {
    Linking.openURL(urls.delegation);
  }, []);

  const transaction = route.params.transaction;
  if (transaction.family !== "tezos") return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="SendFunds" name="ValidationSuccess" />
      <PreventNativeBack />
      <ValidateSuccess
        title={
          <Trans
            i18nKey={"delegation.broadcastSuccessTitle." + transaction.mode}
          />
        }
        description={
          <Trans
            i18nKey={
              "delegation.broadcastSuccessDescription." + transaction.mode
            }
          />
        }
        primaryButton={
          <Button
            event="DelegationSuccessGoToAccount"
            title={<Trans i18nKey="delegation.goToAccount" />}
            type="primary"
            containerStyle={styles.button}
            onPress={goToAccount}
          />
        }
        secondaryButton={
          <Button
            event="DelegationSuccessHowTo"
            title={<Trans i18nKey="delegation.howDelegationWorks" />}
            type="lightSecondary"
            containerStyle={styles.button}
            onPress={goToHelp}
          />
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
