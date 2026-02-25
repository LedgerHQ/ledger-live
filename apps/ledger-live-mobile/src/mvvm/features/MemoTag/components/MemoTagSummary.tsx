import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { Flex } from "@ledgerhq/native-ui";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import memoTagSummaryRow from "~/generated/MemoTagSummary";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

export default function MemoTagSummary({
  transaction,
  account,
  navigation,
  route,
}: {
  transaction: Transaction;
  account: Account;
} & Navigation) {
  const MemoTagSummaryRow =
    memoTagSummaryRow[account.currency.family as keyof typeof memoTagSummaryRow];

  if (!MemoTagSummaryRow) return null;

  return (
    <Flex position="relative">
      <VerticalConnector />

      <MemoTagSummaryRow
        transaction={transaction}
        account={account}
        navigation={navigation}
        route={route}
      />
    </Flex>
  );
}

const VerticalConnector = () => {
  return (
    <View style={[styles.verticalConnector]}>
      <Svg width="2" height="20" viewBox="0 0 2 20" fill="none">
        <Path d="M1 0V20" stroke="#3C3C3C" strokeDasharray="2 2" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  verticalConnector: {
    position: "relative",
    top: -36,
    left: 16,
    marginBottom: -38,
  },
});
