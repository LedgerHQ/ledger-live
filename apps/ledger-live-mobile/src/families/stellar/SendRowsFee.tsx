import React from "react";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CompositeScreenProps } from "@react-navigation/native";
import StellarFeeRow from "./StellarFeeRow";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../../const";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Props = {
  account: AccountLike;
  transaction: Transaction;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
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
export default function StellarSendRowsFee({ account, ...props }: Props) {
  return <StellarFeeRow {...props} account={account} />;
}
