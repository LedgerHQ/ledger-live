/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import OperationIcon from "./OperationIcon";

import colors from "../colors";
import OperationRowDate from "./OperationRowDate";

type Props = {
  operation: Operation,
  account: Account,
  navigation: *,
  multipleAccounts?: boolean,
};

class OperationRow extends PureComponent<Props, *> {
  static defaultProps = {
    displayCurrencyLogo: false,
  };

  goToOperationDetails = () => {
    this.props.navigation.navigate("OperationDetails", {
      account: this.props.account,
      operation: this.props.operation,
    });
  };

  render() {
    const { operation, account, multipleAccounts } = this.props;
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.smoke : colors.green;
    const text = operation.type === "IN" ? "Received" : "Sent";
    const isOptimistic = operation.blockHeight === null;
    return (
      <RectButton
        onPress={this.goToOperationDetails}
        style={[styles.root, isOptimistic ? styles.optimistic : null]}
      >
        {multipleAccounts ? (
          <CurrencyIcon size={20} currency={account.currency} />
        ) : (
          <OperationIcon size={16} containerSize={28} type={operation.type} />
        )}
        <View style={[styles.body, styles.bodyLeft]}>
          <LText
            numberOfLines={1}
            semiBold
            ellipsizeMode="tail"
            style={styles.topLine}
          >
            {multipleAccounts ? account.name : text}
          </LText>
          <LText numberOfLines={1} style={styles.bottomLine}>
            <OperationRowDate text={text} date={operation.date} />
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
              value={amount}
              alwaysShowSign
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
              value={amount}
              alwaysShowSign
            />
          </LText>
        </View>
      </RectButton>
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
  optimistic: {
    opacity: 0.5,
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
    fontSize: 14,
    lineHeight: 17,
    height: 18,
    color: colors.grey,
  },
});
