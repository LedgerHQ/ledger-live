// @flow

import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

type Props = {
  settleTrade: Function,
  account: Account,
};

const SkipDeviceVerification = ({ settleTrade, account }: Props) => {
  const currency = getAccountCurrency(account);
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <LText style={[styles.title, { color: colors.darkBlue }]}>
        <Trans
          i18nKey="exchange.buy.skipDeviceVerification.address"
          values={{
            currency: currency.name,
          }}
        />
      </LText>
      <View style={styles.account}>
        <CurrencyIcon color={colors.live} size={16} currency={currency} />
        <LText style={styles.accountName} semiBold>
          {account.name}
        </LText>
      </View>
      <View
        style={[
          styles.addressContainer,
          { backgroundColor: colors.background, borderColor: colors.fog },
        ]}
      >
        <LText style={styles.address} semiBold>
          {account.freshAddress}
        </LText>
      </View>
      <Alert type="danger">
        <Trans i18nKey="exchange.buy.skipDeviceVerification.warning" />
      </Alert>
      <View style={styles.confirmationFooter}>
        <Button
          event="SkipDeviceModalCancel"
          containerStyle={styles.confirmationButton}
          type="secondary"
          title={<Trans i18nKey="exchange.buy.skipDeviceVerification.cancel" />}
          onPress={() => settleTrade(false)}
        />

        <Button
          event="SkipDeviceModalConfirm"
          containerStyle={[
            styles.confirmationButton,
            styles.confirmationLastButton,
          ]}
          type={"primary"}
          title={
            <Trans i18nKey="exchange.buy.skipDeviceVerification.confirm" />
          }
          onPress={() => settleTrade(true)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    opacity: 0.5,
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  accountName: {
    marginLeft: 8,
    fontSize: 16,
  },
  addressContainer: {
    marginBottom: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  address: {
    fontSize: 14,
    textAlign: "center",
  },
  confirmationFooter: {
    flexDirection: "row",
    marginTop: 24,
  },
  confirmationButton: {
    flexGrow: 1,
  },
  confirmationLastButton: {
    marginLeft: 16,
  },
});

export default SkipDeviceVerification;
