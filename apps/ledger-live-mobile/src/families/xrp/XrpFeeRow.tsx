import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import { useMaybeAccountUnit } from "~/hooks/useAccountUnit";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
};

export default function XrpFeeRow({ account, transaction }: Props) {
  const unit = useMaybeAccountUnit(account);
  if (account.type !== "Account" || !unit) return null;
  const fee = (transaction as RippleTransaction).fee;
  const feeCustomUnit = (transaction as RippleTransaction).feeCustomUnit;
  return (
    <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
      <View
        style={{
          alignItems: "flex-end",
        }}
      >
        <View style={styles.accountContainer}>
          {fee ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={feeCustomUnit || unit} value={fee} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue} color="grey">
          {fee ? <CounterValue before="≈ " value={fee} currency={account.currency} /> : null}
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
  summaryRowText: {
    fontSize: 16,
    textAlign: "right",
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
});
