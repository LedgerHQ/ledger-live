import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as PolkadotTransaction } from "@ledgerhq/live-common/families/polkadot/types";
import { Trans } from "react-i18next";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import ExternalLink from "../../icons/ExternalLink";
import { urls } from "../../config/urls";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../../const";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { PolkadotBondFlowParamList } from "./BondFlow/types";

type Navigation = CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
  | StackNavigatorProps<
      PolkadotBondFlowParamList,
      ScreenName.PolkadotBondAmount
    >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  navigation?: Navigation["navigation"];
  route?: Navigation["route"];
};

export default function PolkadotFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesPolkadot);
  }, []);
  const fees = (transaction as PolkadotTransaction).fees
    ? (transaction as PolkadotTransaction).fees
    : null;
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
      <View style={styles.wrapper}>
        <LText style={styles.valueText}>
          {fees ? <CurrencyUnitValue unit={unit} value={fees} /> : " "}
        </LText>
        <LText style={styles.countervalue} color="grey">
          {fees ? (
            <CounterValue before="≈ " value={fees} currency={currency} />
          ) : (
            " "
          )}
        </LText>
      </View>
    </SummaryRow>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "column",
    alignItems: "flex-end",
    flex: 1,
  },
  countervalue: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 16,
  },
});
