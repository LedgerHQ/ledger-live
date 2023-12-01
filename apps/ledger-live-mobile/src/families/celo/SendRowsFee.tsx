import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as CeloTransaction } from "@ledgerhq/live-common/families/celo/types";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import ExternalLink from "~/icons/ExternalLink";
import { urls } from "~/utils/urls";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import type { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import type { CeloLockFlowParamList } from "./LockFlow/types";
import type { CeloRevokeFlowFlowParamList } from "./RevokeFlow/types";
import type { CeloUnlockFlowParamList } from "./UnlockFlow/types";
import type { CeloVoteFlowParamList } from "./VoteFlow/types";
import type { CeloWithdrawFlowParamList } from "./WithdrawFlow/types";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<CeloLockFlowParamList, ScreenName.CeloLockAmount>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
  | StackNavigatorProps<CeloRevokeFlowFlowParamList, ScreenName.CeloRevokeAmount>
  | StackNavigatorProps<CeloUnlockFlowParamList, ScreenName.CeloUnlockAmount>
  | StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteAmount>
  | StackNavigatorProps<CeloWithdrawFlowParamList, ScreenName.CeloWithdrawAmount>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function CeloFeeRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const extraInfoFees = useCallback(() => {
    Linking.openURL(urls.feesMoreInfo);
  }, []);

  const fees = (transaction as CeloTransaction).fees;
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
      <View style={styles.accountContainer}>
        {fees ? (
          <LText semiBold style={styles.valueText}>
            <CurrencyUnitValue unit={unit} value={fees} />
          </LText>
        ) : null}
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
    height: 18,
    justifyContent: "flex-end",
  },
  countervalue: {
    paddingLeft: 6,
    paddingRight: 4,
    fontSize: 12,
    alignSelf: "center",
  },
  valueText: {
    alignSelf: "center",
    fontSize: 14,
  },
});
