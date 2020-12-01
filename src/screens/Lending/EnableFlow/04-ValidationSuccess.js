/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Operation, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { Trans } from "react-i18next";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import UpdateIcon from "../../../icons/Update";
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
  const onClose = useCallback(() => {
    const n = navigation.dangerouslyGetParent() || navigation;
    n.pop();
  }, [navigation]);

  const { currency } = route.params;

  return (
    <View style={styles.root}>
      <TrackScreen
        category="Lend Approve"
        name="Success"
        eventProperties={{ currencyName: currency?.name }}
      />
      <PreventNativeBack />
      <ValidateSuccess
        icon={<UpdateIcon size={24} color={colors.live} />}
        iconColor={colors.live}
        title={<Trans i18nKey="transfer.lending.enable.validation.success" />}
        description={
          <Trans i18nKey="transfer.lending.enable.validation.info" />
        }
        info={<Trans i18nKey="transfer.lending.enable.validation.extraInfo" />}
        onLearnMore={() => {
          Linking.openURL(urls.approvedOperation);
        }}
        onClose={onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
