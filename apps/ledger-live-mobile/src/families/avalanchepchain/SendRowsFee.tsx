import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as AvalanchePChainTransaction } from "@ledgerhq/live-common/families/avalanchepchain/types";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../../const";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
} & CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<
      LendingEnableFlowParamsList,
      ScreenName.LendingEnableSummary
    >
  | StackNavigatorProps<
      LendingSupplyFlowNavigatorParamList,
      ScreenName.LendingSupplySummary
    >
  | StackNavigatorProps<
      LendingWithdrawFlowNavigatorParamList,
      ScreenName.LendingWithdrawSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function AvalancheFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  const fees = (transaction as AvalanchePChainTransaction).fees;
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
          {fees ? (
            <LText style={styles.valueText}>
              <CurrencyUnitValue unit={unit} value={fees} />
            </LText>
          ) : null}
        </View>
        <LText style={styles.countervalue} color="grey">
          {fees ? (
            <CounterValue before="≈ " value={fees} currency={currency} />
          ) : null}
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
