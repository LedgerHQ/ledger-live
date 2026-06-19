import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { Trans } from "~/context/Locale";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getFeesCurrency, getFeesUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import ExternalLink from "~/icons/ExternalLink";
import { urls } from "~/utils/urls";

type Props = {
  transaction: Transaction;
} & (
  | {
      account: Account;
      parentAccount?: Account | null;
    }
  | {
      account: TokenAccount;
      parentAccount: Account;
    }
);
export default function TezosFeeRow({ account, parentAccount, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  if (transaction.family !== "tezos") return null;

  const mainAccount = getMainAccount(account, parentAccount);
  const feesCurrency = getFeesCurrency(mainAccount);
  const feesUnit = getFeesUnit(feesCurrency);
  const fees = transaction.fees;
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
              <CurrencyUnitValue unit={feesUnit} value={fees} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue} color="grey">
          {fees ? <CounterValue before="≈ " value={fees} currency={feesCurrency} /> : null}
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
