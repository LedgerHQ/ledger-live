/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableHighlight } from "react-native";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import OperationIcon from "./OperationIcon";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

import colors from "../colors";

type Props = {
  operation: Operation,
  account: Account,
  navigation: *,
};

class OperationRow extends PureComponent<Props, *> {
  goToOperationDetails = () => {
    this.props.navigation.navigate("OperationDetails", {
      account: this.props.account,
      operation: this.props.operation,
    });
  };

  render() {
    const { operation, account } = this.props;
    const valueColor = operation.type === "IN" ? colors.green : colors.smoke;

    return (
      <TouchableHighlight onPress={this.goToOperationDetails}>
        <View style={styles.root}>
          <OperationIcon size={16} containerSize={28} type={operation.type} />
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
      </TouchableHighlight>
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
