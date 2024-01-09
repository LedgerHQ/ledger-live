import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useTheme } from "@react-navigation/native";
import LText from "~/components/LText";
import CurrencyIcon from "~/components/CurrencyIcon";
import Button from "~/components/Button";
import Alert from "~/components/Alert";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
  account: AccountLike;
};

// FIXME: WE ONLY ACCEPTED Account TYPES, YET THIS IS FAR FROM
// REALITY AS THE ROUTEPARAMS ACCEPT AN AccountLike
// WE HAVE CASTED AS ACCOUNT BUT THIS NEEDS BETTER TYPECHECKING AND SAFE CODE AS
// WE ARE NOT CHECKING FOR TOKEN OR CHILD ACCOUNT
const SkipDeviceVerification = ({ onCancel, onConfirm, account }: Props) => {
  const currency = getAccountCurrency(account);
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <LText
        style={[
          styles.title,
          {
            color: colors.darkBlue,
          },
        ]}
      >
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
          {(account as Account).name}
        </LText>
      </View>
      <View
        style={[
          styles.addressContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.fog,
          },
        ]}
      >
        <LText style={styles.address} semiBold>
          {(account as Account).freshAddress}
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
          onPress={onCancel}
        />

        <Button
          event="SkipDeviceModalConfirm"
          containerStyle={[styles.confirmationButton, styles.confirmationLastButton]}
          type={"primary"}
          title={<Trans i18nKey="exchange.buy.skipDeviceVerification.confirm" />}
          onPress={onConfirm}
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
