/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import type {
  Account,
  Operation,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";

import debounce from "lodash/debounce";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";

import OperationIcon from "./OperationIcon";
import colors from "../colors";
import OperationRowDate from "./OperationRowDate";
import LiveLogo from "../icons/LiveLogoIcon";
import Spinning from "./Spinning";

type Props = {
  operation: Operation,
  parentAccount: ?Account,
  account: AccountLike,
  navigation: *,
  multipleAccounts?: boolean,
  isLast: boolean,
  isSubOperation?: boolean,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

class OperationRow extends PureComponent<Props, *> {
  static defaultProps = {
    displayCurrencyLogo: false,
  };

  goToOperationDetails = debounce(() => {
    const {
      navigation,
      account,
      parentAccount,
      operation,
      isSubOperation,
    } = this.props;
    const params = {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      operation, // FIXME we should pass a operationId instead because data can changes over time.
      isSubOperation,
      key: operation.id,
    };

    navigation.push("OperationDetails", params);
  }, 300);

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

    const text = <Trans i18nKey={`operations.types.${operation.type}`} />;

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
        <TouchableOpacity
          onPress={this.goToOperationDetails}
          style={styles.button}
        >
          <View style={isOptimistic ? styles.optimistic : null}>
            <OperationIcon
              size={40}
              operation={operation}
              account={account}
              parentAccount={parentAccount}
            />
          </View>
          <View
            style={[styles.wrapper, isOptimistic ? styles.optimistic : null]}
          >
            <View style={styles.body}>
              <LText
                numberOfLines={1}
                semiBold
                style={[styles.bodyLeft, styles.topRow]}
              >
                {multipleAccounts ? getAccountName(account) : text}
              </LText>
              <LText
                tertiary
                numberOfLines={1}
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
        </TouchableOpacity>
      </View>
    );
  }
}

const OpCounterValue = ({ children }: { children: * }) => (
  <LText tertiary numberOfLines={1} style={styles.bottomRow}>
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
