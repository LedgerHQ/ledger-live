/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account, Operation } from "@ledgerhq/wallet-common/lib/types";
import colors from "../../colors";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";

class OperationRow extends PureComponent<{
  operation: Operation,
  account: Account
}> {
  render() {
    const { operation, account } = this.props;
    const { unit, currency } = account;
    const color = operation.amount >= 0 ? colors.green : "black";
    return (
      <View style={styles.root}>
        <CurrencyIcon size={32} currency={currency} />
        <View style={styles.curencyIcon}>
          <LText
            numberOfLines={1}
            semiBold
            ellipsizeMode="middle"
            style={styles.operationsAccountName}
          >
            {account.name}
          </LText>
          <LText
            numberOfLines={1}
            ellipsizeMode="middle"
            style={styles.address}
          >
            {operation.address}
          </LText>
        </View>
        <View style={styles.amountContainer}>
          <LText style={[styles.currencyValue, { color }]}>
            <CurrencyUnitValue unit={unit} value={operation.amount} />
          </LText>
          <LText style={styles.counterValue}>
            <CounterValue
              value={operation.amount}
              date={operation.date}
              currency={account.currency}
            />
          </LText>
        </View>
      </View>
    );
  }
}

export default OperationRow;

const styles = StyleSheet.create({
  root: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
    alignItems: "center",
    flexDirection: "row"
  },
  curencyIcon: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 10
  },
  address: {
    fontSize: 12,
    opacity: 0.5
  },
  amountContainer: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 10,
    alignItems: "flex-end"
  },
  operationsAccountName: {
    marginLeft: 6,
    fontSize: 12
  },
  currencyValue: {
    fontSize: 14
  },
  counterValue: {
    fontSize: 12,
    opacity: 0.5
  }
});
