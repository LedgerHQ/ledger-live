import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { TransactionStatus as SolanaTransactionStatus } from "@ledgerhq/live-common/families/solana/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import CounterValue from "../../components/CounterValue";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { urls } from "../../config/urls";
import ExternalLink from "../../icons/ExternalLink";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../../const";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  status?: TransactionStatus;
} & CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function SolanaFeeRow({ account, status }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.solana.supportPage);
  }, []);

  const fees = (status as SolanaTransactionStatus).estimatedFees;

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
