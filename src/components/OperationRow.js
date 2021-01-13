/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getMainAccount,
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
import { ScreenName } from "../const";
import OperationRowDate from "./OperationRowDate";
import LiveLogo from "../icons/LiveLogoIcon";
import Spinning from "./Spinning";

import perFamilyOperationDetails from "../generated/operationDetails";

type Props = {
  operation: Operation,
  parentAccount: ?Account,
  account: AccountLike,
  multipleAccounts?: boolean,
  isLast: boolean,
  isSubOperation?: boolean,
};

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

export default function OperationRow({
  account,
  parentAccount,
  operation,
  isSubOperation,
  multipleAccounts,
  isLast,
}: Props) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const goToOperationDetails = debounce(() => {
    const params = [
      ScreenName.OperationDetails,
      {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
        operation, // FIXME we should pass a operationId instead because data can changes over time.
        isSubOperation,
        key: operation.id,
      },
    ];

    /** if suboperation push to stack navigation else we simply navigate */
    if (isSubOperation) navigation.push(...params);
    else navigation.navigate(...params);
  }, 300);

  const renderAmountCellExtra = useCallback(() => {
    const mainAccount = getMainAccount(account, parentAccount);
    const currency = getAccountCurrency(account);
    const unit = getAccountUnit(account);
    const specific = mainAccount.currency.family
      ? perFamilyOperationDetails[mainAccount.currency.family]
      : null;

    const SpecificAmountCell =
      specific && specific.amountCell
        ? specific.amountCell[operation.type]
        : null;

    return SpecificAmountCell ? (
      <SpecificAmountCell
        operation={operation}
        unit={unit}
        currency={currency}
      />
    ) : null;
  }, [account, parentAccount, operation]);

  const amount = getOperationAmountNumber(operation);
  const valueColor = amount.isNegative() ? "darkBlue" : "green";
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);

  const text = <Trans i18nKey={`operations.types.${operation.type}`} />;
  const isOptimistic = operation.blockHeight === null;
  const spinner = (
    <View style={styles.spinner}>
      <Spinning>
        <LiveLogo color={colors.grey} size={10} />
      </Spinning>
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.lightGrey,
        },
        isLast ? styles.last : null,
      ]}
    >
      <TouchableOpacity onPress={goToOperationDetails} style={styles.button}>
        <View style={isOptimistic ? styles.optimistic : null}>
          <OperationIcon
            size={40}
            operation={operation}
            account={account}
            parentAccount={parentAccount}
          />
        </View>

        <View style={[styles.wrapper, isOptimistic ? styles.optimistic : null]}>
          <View style={styles.bodyLeft}>
            <LText
              numberOfLines={1}
              semiBold
              style={[styles.bodyLeft, styles.topRow]}
            >
              {multipleAccounts ? getAccountName(account) : text}
            </LText>

            {isOptimistic ? (
              <View style={styles.optimisticRow}>
                {spinner}
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
              </View>
            ) : (
              <LText numberOfLines={1} color="grey" style={[styles.bottomRow]}>
                {text} <OperationRowDate date={operation.date} />
              </LText>
            )}
          </View>

          <View style={styles.bodyRight}>{renderAmountCellExtra()}</View>

          {amount.isZero() ? null : (
            <View style={styles.bodyRight}>
              <LText
                semiBold
                numberOfLines={1}
                color={valueColor}
                style={[styles.bodyRight, styles.topRow]}
              >
                <CurrencyUnitValue
                  showCode
                  unit={unit}
                  value={amount}
                  alwaysShowSign
                />
              </LText>
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
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const OpCounterValue = ({ children }: { children: React$Node }) => (
  <LText semiBold numberOfLines={1} style={styles.bottomRow}>
    {children}
  </LText>
);

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 2,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 16,
    marginRight: 10,
  },
  body: {
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "flex-start",
    flex: 1,
  },
  topRow: {
    fontSize: 14,
    flex: 1,
  },
  bottomRow: {
    fontSize: 14,
    flex: 1,
  },
  optimisticRow: { flexDirection: "row", alignItems: "center" },
  optimistic: {
    opacity: 0.5,
  },
  bodyLeft: {
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "flex-start",
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyRight: {
    alignItems: "flex-end",
    flexDirection: "column",
    justifyContent: "flex-start",
    flexShrink: 0,
    paddingLeft: 6,
  },
  spinner: {
    height: 14,
    marginRight: 4,
    justifyContent: "center",
  },
});
