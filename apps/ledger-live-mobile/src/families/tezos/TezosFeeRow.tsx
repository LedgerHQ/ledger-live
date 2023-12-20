import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import ExternalLink from "~/icons/ExternalLink";
import { urls } from "~/utils/urls";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
};
export default function TezosFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);
  if (transaction.family !== "tezos") return null;
  const fees = transaction.fees;
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);
  return (
    <SummaryRow
      onPress={extraInfoFees}
      title={<Trans i18nKey="send.fees.title" />}
      additionalInfo={
        <View>
          <ExternalLink size={12} color={colors.grey} />
        </View>
      }
    >
      <View
        style={{
          alignItems: "flex-end",
        }}
      >
        <View style={styles.accountContainer}>
          {fees ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue} color="grey">
          {fees ? <CounterValue before="≈ " value={fees} currency={currency} /> : null}
        </LText>
      </View>
    </SummaryRow>
  );
}
const styles = StyleSheet.create({
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
});
