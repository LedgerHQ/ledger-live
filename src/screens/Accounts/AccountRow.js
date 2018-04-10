/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CurrencyIcon from "../../components/CurrencyIcon";
import CounterValue from "../../components/CounterValue";

export default class AccountRow extends PureComponent<{
  account: Account
}> {
  render() {
    const { account } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.icon}>
          <CurrencyIcon currency={account.currency} size={32} />
        </View>
        <LText numberOfLines={1} style={styles.account}>
          {account.name}
        </LText>
        <View style={styles.operationsColumn}>
          <LText semiBold style={styles.currencyUnit}>
            <CurrencyUnitValue unit={account.unit} value={account.balance} />
          </LText>
          <LText style={styles.operationsSubText}>
            <CounterValue value={account.balance} currency={account.currency} />
          </LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginVertical: 6,
    marginHorizontal: 16,
    height: 60,
    padding: 5,
    borderRadius: 4,
    backgroundColor: "white",
    alignItems: "center",
    flexDirection: "row"
  },
  icon: {
    marginRight: 10
  },
  account: {
    fontSize: 14,
    flex: 1
  },
  currencyUnit: {
    fontSize: 14
  },
  operationsColumn: {
    flexDirection: "column",
    marginLeft: 4,
    marginRight: 8,
    alignItems: "flex-end"
  },
  operationsSubText: {
    fontSize: 12,
    color: "#999"
  }
});
