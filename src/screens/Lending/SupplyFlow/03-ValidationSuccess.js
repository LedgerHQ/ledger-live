/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Operation, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { urls } from "../../../config/urls";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  result: Operation,
  currency: TokenCurrency,
};

export default function ValidationSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onClose = useCallback(() => {
    const n = navigation.dangerouslyGetParent() || navigation;
    n.pop();
  }, [navigation]);

  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const goToOperationDetails = useCallback(() => {
    if (!account) return;
    const result = route.params?.result;
    if (!result) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      operation:
        result.subOperations && result.subOperations[0]
          ? result.subOperations[0]
          : result,
    });
  }, [account, route.params?.result, navigation, parentAccount]);

  const { currency } = route.params;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Lend Supply"
        name="Success"
        eventProperties={{ currencyName: currency?.name }}
      />
      <PreventNativeBack />
      <ValidateSuccess
        title={<Trans i18nKey="transfer.lending.supply.validation.success" />}
        description={
          <Trans i18nKey="transfer.lending.supply.validation.info" />
        }
        info={<Trans i18nKey="transfer.lending.supply.validation.extraInfo" />}
        onLearnMore={() => {
          Linking.openURL(urls.approvedOperation);
        }}
        onViewDetails={goToOperationDetails}
        onClose={onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
