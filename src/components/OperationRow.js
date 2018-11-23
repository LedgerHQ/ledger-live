/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { Trans } from "react-i18next";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import OperationIcon from "./OperationIcon";

import colors from "../colors";
import OperationRowDate from "./OperationRowDate";
import LiveLogo from "../icons/LiveLogoIcon";
import Spinning from "./Spinning";

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
      accountId: this.props.account.id,
      operation: this.props.operation,
    });
  };

  render() {
    const { operation, account, multipleAccounts } = this.props;
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.smoke : colors.green;
    const text =
      operation.type === "IN" ? (
        <Trans i18nKey="common.received" />
      ) : (
        <Trans i18nKey="common.sent" />
      );
    const isOptimistic = operation.blockHeight === null;
    const spinner = (
      <View
        style={{
          height: 14,
          marginRight: 4,
          justifyContent: "center",
        }}
      >
        <Spinning>
          <LiveLogo color={colors.grey} size={10} />
        </Spinning>
      </View>
    );

    return (
      <View>
        <RectButton
          onPress={this.goToOperationDetails}
          style={[styles.root, isOptimistic ? styles.optimistic : null]}
        >
          {multipleAccounts ? (
            <CurrencyIcon size={20} currency={account.currency} />
          ) : (
            <OperationIcon size={16} containerSize={28} type={operation.type} />
          )}
          <View style={styles.wrapper}>
            <View style={styles.body}>
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="tail"
                style={[styles.bodyLeft, styles.topRow]}
              >
                {multipleAccounts ? account.name : text}
              </LText>
              <LText
                tertiary
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.bodyRight, styles.topRow, { color: valueColor }]}
              >
                <CurrencyUnitValue
                  showCode
                  unit={account.unit}
                  value={amount}
                  alwaysShowSign
                />
              </LText>
            </View>
            <View style={styles.body}>
              {isOptimistic && spinner}
              {isOptimistic ? (
                <LText
                  numberOfLines={1}
                  style={[styles.bodyLeft, styles.bottomRow]}
                >
                  <Trans
                    i18nKey={
                      amount.isNegative()
                        ? "operationDetails.sending"
                        : "operationDetails.receiving"
                    }
                  />
                </LText>
              ) : (
                <LText
                  numberOfLines={1}
                  style={[styles.bodyLeft, styles.bottomRow]}
                >
                  {text} <OperationRowDate date={operation.date} />
                </LText>
              )}
              <LText
                tertiary
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.bottomRow, styles.bodyRight]}
              >
                <CounterValue
                  showCode
                  currency={account.currency}
                  value={amount}
                  alwaysShowSign
                />
              </LText>
            </View>
          </View>
        </RectButton>
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
  wrapper: { flex: 1, flexDirection: "column", marginHorizontal: 10 },
  body: {
    flexDirection: "row",
    flex: 1,
  },
  topRow: {
    color: colors.smoke,
    fontSize: 14,
    lineHeight: 17,
    height: 18,
  },
  bottomRow: {
    color: colors.grey,
    fontSize: 14,
    lineHeight: 17,
    height: 18,
  },
  optimistic: {
    opacity: 0.5,
  },
  bodyLeft: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyRight: {
    alignItems: "flex-end",
  },
});
