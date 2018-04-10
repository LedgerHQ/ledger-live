/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account, Operation } from "@ledgerhq/wallet-common/lib/types";
import colors from "../colors";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

class OperationRowAmount extends PureComponent<{
  operation: Operation,
  account: Account
}> {
  render() {
    const { operation, account } = this.props;
    const { unit } = account;
    return (
      <View style={styles.amountContainer}>
        <LText
          style={[
            styles.currencyValue,
            operation.amount >= 0
              ? styles.currencyValuePositive
              : styles.currencyValueNegative
          ]}
        >
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
    );
  }
}

export default OperationRowAmount;

const styles = StyleSheet.create({
  amountContainer: {
    flexDirection: "column",
    marginHorizontal: 10,
    alignItems: "flex-end"
  },
  currencyValue: {
    fontSize: 14
  },
  currencyValuePositive: { color: colors.green },
  currencyValueNegative: { color: "black" },
  counterValue: {
    fontSize: 12,
    opacity: 0.5
  }
});
