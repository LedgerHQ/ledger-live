import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import SummaryRow from "../../screens/SendFunds/SummaryRow";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import { ScreenName } from "../../const";
import Edit from "../../icons/Edit";

import type { Transaction as AptosTransaction } from "@ledgerhq/live-common/families/aptos/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { CompositeScreenProps } from "@react-navigation/native";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type Props = {
  transaction: Transaction;
  account: AccountLike;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function SendRowsFee({ transaction, account }: Props) {
  const currency = getAccountCurrency(account);
  const unit = currency.units[0];
  const { fees } = transaction as AptosTransaction;
  return (
    <View>
      <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
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
    </View>
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
