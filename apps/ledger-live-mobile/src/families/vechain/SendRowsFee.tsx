import { getFeesCurrency, getFeesUnit } from "@ledgerhq/live-common/account/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TransactionStatus as VechainTransactionStatus } from "@ledgerhq/live-common/families/vechain/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { CompositeScreenProps } from "@react-navigation/native";
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  status?: TransactionStatus;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function VechainFeeRow({ account, status }: Props) {
  const fees = (status as VechainTransactionStatus).estimatedFees;
  const currency = getFeesCurrency(account);
  const unit = getFeesUnit(currency);

  return (
    <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
      <View style={{ alignItems: "flex-end" }}>
        <View style={styles.accountContainer}>
          <Text style={styles.valueText}>
            <CurrencyUnitValue unit={unit} value={fees} />
          </Text>
        </View>
        <Text style={styles.countervalue} color="grey">
          <CounterValue before="≈ " value={fees} currency={currency} />
        </Text>
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
