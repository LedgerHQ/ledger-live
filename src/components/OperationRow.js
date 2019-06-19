/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { Trans } from "react-i18next";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import type {
  TokenAccount,
  Account,
  Operation,
} from "@ledgerhq/live-common/lib/types";

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
  parentAccount: ?Account,
  account: TokenAccount | Account,
  navigation: *,
  multipleAccounts?: boolean,
  isLast: boolean,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

class OperationRow extends PureComponent<Props, *> {
  static defaultProps = {
    displayCurrencyLogo: false,
  };

  goToOperationDetails = () => {
    const { navigation, account, parentAccount, operation } = this.props;
    navigation.navigate("OperationDetails", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      operation, // FIXME we should pass a operationId instead because data can changes over time.
    });
  };

  render() {
    const {
      operation,
      account,
      parentAccount,
      multipleAccounts,
      isLast,
    } = this.props;
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.darkBlue : colors.green;
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);

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
      <View style={[styles.root, isLast ? styles.last : null]}>
        <RectButton onPress={this.goToOperationDetails} style={styles.button}>
          <View style={isOptimistic ? styles.optimistic : null}>
            {multipleAccounts ? (
              <CurrencyIcon size={20} currency={currency} />
            ) : (
              <View>
                <OperationIcon
                  size={28}
                  operation={operation}
                  account={account}
                  parentAccount={parentAccount}
                />
              </View>
            )}
          </View>
          <View
            style={[styles.wrapper, isOptimistic ? styles.optimistic : null]}
          >
            <View style={styles.body}>
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="tail"
                style={[styles.bodyLeft, styles.topRow]}
              >
                {multipleAccounts
                  ? account.type === "TokenAccount"
                    ? currency.name
                    : account.name
                  : text}
              </LText>
              <LText
                tertiary
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.bodyRight, styles.topRow, { color: valueColor }]}
              >
                <CurrencyUnitValue
                  showCode
                  unit={unit}
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
              <View style={styles.bodyRight}>
                <CounterValue
                  showCode
                  date={operation.date}
                  currency={currency}
                  value={amount}
                  alwaysShowSign
                  withPlaceholder
                  placeholderProps={placeholderProps}
                  Wrapper={OpCounterValue}
                />
              </View>
            </View>
          </View>
        </RectButton>
      </View>
    );
  }
}

const OpCounterValue = ({ children }: { children: * }) => (
  <LText
    tertiary
    numberOfLines={1}
    ellipsizeMode="tail"
    style={styles.bottomRow}
  >
    {children}
  </LText>
);

export default OperationRow;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.white,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.lightGrey,
  },
  last: {
    borderBottomWidth: 0,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
  },
  wrapper: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 16,
    marginRight: 10,
  },
  body: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  topRow: {
    color: colors.darkBlue,
    fontSize: 14,
    marginBottom: 2,
  },
  bottomRow: {
    color: colors.grey,
    fontSize: 14,
  },
  optimistic: {
    opacity: 0.5,
  },
  bodyLeft: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyRight: {
    paddingLeft: 4,
    height: 20,
    alignItems: "flex-end",
  },
});
