import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { useTheme } from "@react-navigation/native";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import { ScreenName } from "../../const";
import Edit from "../../icons/Edit";

import type { Transaction } from "@ledgerhq/live-common/families/aptos/types";
import { Account } from "@ledgerhq/types-live";
import { Navigation, RouteProps } from "./types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

type Props = {
  transaction: Transaction;
  account: Account;
  navigation: Navigation;
  route: RouteProps;
  setTransaction: (_: Transaction) => void;
};

export default function SendRowsFee({
  transaction,
  account,
  navigation,
  route,
  setTransaction,
}: Props) {
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);
  const { fees } = transaction;
  const { colors } = useTheme();

  const setCustomFees = useCallback(
    (txPatch: Partial<Transaction>) => {
      const bridge = getAccountBridge(account);
      const updatedTx = bridge.updateTransaction(transaction, { ...txPatch });
      setTransaction(updatedTx);
    },
    [account, transaction, setTransaction],
  );

  const openFeesSettings = useCallback(() => {
    navigation.navigate(ScreenName.AptosCustomFees, {
      ...route.params,
      accountId: account.id,
      transaction,
      setCustomFees,
    });
  }, [navigation, route.params, transaction, account.id, setCustomFees]);

  return (
    <TouchableOpacity onPress={openFeesSettings} activeOpacity={0.7}>
      <SummaryRow
        title={<Trans i18nKey="send.fees.title" />}
        additionalInfo={<Edit size={14} color={colors.grey} />}
      >
        <View
          style={{
            alignItems: "flex-end",
          }}
        >
          <>
            <LText style={styles.valueText} semiBold>
              <CurrencyUnitValue unit={unit} value={fees} disableRounding />
            </LText>
            <LText style={styles.counterValueText} color="grey" semiBold>
              <CounterValue before="≈ " value={fees as BigNumber} currency={currency} showCode />
            </LText>
          </>
        </View>
      </SummaryRow>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  amountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 16,
  },
  counterValueText: {
    fontSize: 12,
  },
});
