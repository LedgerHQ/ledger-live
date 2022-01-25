// @flow
import { BigNumber } from "bignumber.js";
import isBefore from "date-fns/isBefore";
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import { useTheme } from "@react-navigation/native";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import LText from "../../../components/LText";
import DateFromNow from "../../../components/DateFromNow";
import { WithdrawAction } from "./Actions";

type Props = {
  amount: BigNumber,
  completionDate?: Date,
  account: Account,
  onWithdraw?: () => void,
  disabled?: boolean,
  isLast?: boolean,
};

export default function UnlockingRow({
  amount,
  completionDate,
  account,
  onWithdraw,
  disabled = false,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  const isUnlocked = useMemo(
    () => completionDate && isBefore(completionDate, new Date(Date.now())),
    [completionDate],
  );

  return (
    <View
      style={[
        styles.row,
        styles.wrapper,
        !isLast
          ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey }
          : undefined,
      ]}
    >
      <View style={styles.valueWrapper}>
        <LText semiBold>
          <CurrencyUnitValue value={amount} unit={unit} />
        </LText>
        <LText style={styles.valueCounterValue} color="grey">
          <CounterValue currency={currency} value={amount} withPlaceholder />
        </LText>
      </View>
      {!isUnlocked && completionDate ? (
        <View style={styles.dateWrapper}>
          <LText numberOfLines={1} semiBold>
            <DateFromNow date={new Date(completionDate).getTime()} />
          </LText>
        </View>
      ) : null}
      {isUnlocked && onWithdraw ? (
        <View style={styles.dateWrapper}>
          <WithdrawAction onPress={onWithdraw} disabled={disabled} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueWrapper: {
    flex: 1,
    marginRight: 8,
  },
  valueCounterValue: {
    fontSize: 14,
    flex: 1,
  },
  dateWrapper: {},
  withdrawButton: {
    flexBasis: "auto",
    flexGrow: 0.5,
  },
});
