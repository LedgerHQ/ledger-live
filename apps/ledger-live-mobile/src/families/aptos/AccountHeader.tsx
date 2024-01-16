import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

type Props = {
  account: AptosAccount;
};

function AptosAccountHeader({ account }: Props) {
  const unit = getAccountUnit(account);
  const { delegatedBalance } = account;

  return (
    <View style={styles.root}>
      <LText style={styles.labelText} color="grey">
        <Trans i18nKey="account.delegatedAssets" />
      </LText>
      <LText style={styles.valueText} semiBold>
        <CurrencyUnitValue unit={unit} value={delegatedBalance} disableRounding />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: -16,
  },
  amountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  labelText: {
    fontSize: 13,
  },
  valueText: {
    fontSize: 15,
  },
});

export default AptosAccountHeader;
