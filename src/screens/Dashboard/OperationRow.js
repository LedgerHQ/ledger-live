/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

import LText from "../../components/LText";
import OperationIcon from "../../components/OperationIcon";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";

import colors from "../../colors";

class OperationRow extends PureComponent<{
  operation: Operation,
  account: Account,
}> {
  render() {
    const { operation, account } = this.props;
    const valueColor = operation.type === "IN" ? colors.green : colors.smoke;

    return (
      <View style={styles.root}>
        <OperationIcon size={16} type={operation.type} />
        <View style={[styles.body, styles.bodyLeft]}>
          <LText
            numberOfLines={1}
            semiBold
            ellipsizeMode="tail"
            style={styles.topLine}
          >
            {account.name}
          </LText>
          <LText numberOfLines={1} style={styles.bottomLine}>
            {operation.date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </LText>
        </View>
        <View style={[styles.body, styles.bodyRight]}>
          <LText
            tertiary
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.topLine, { color: valueColor }]}
          >
            <CurrencyUnitValue
              showCode
              unit={account.unit}
              value={operation.value}
            />
          </LText>
          <LText
            tertiary
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.bottomLine}
          >
            <CounterValue
              showCode
              currency={account.currency}
              value={operation.value}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    flexDirection: "row",
  },
  body: {
    flexDirection: "column",
    marginHorizontal: 10,
  },
  bodyLeft: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyRight: {
    alignItems: "flex-end",
  },
  topLine: {
    fontSize: 14,
    lineHeight: 17,
    height: 18,
    color: colors.smoke,
  },
  bottomLine: {
    fontSize: 12,
    lineHeight: 17,
    height: 18,
    color: colors.grey,
  },
});
