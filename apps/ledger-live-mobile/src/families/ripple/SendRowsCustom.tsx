import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import SendRowTag from "./SendRowTag";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "../../const";

type Navigation = BaseComposite<
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
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  transaction: Transaction;
  account: Account;
} & Navigation;
export default function RippleSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return <SendRowTag {...rest} transaction={transaction} />;
}
