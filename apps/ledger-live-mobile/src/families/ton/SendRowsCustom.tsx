import { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SendRowComment from "./SendRowComment";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  transaction: Transaction;
  account: Account;
} & Navigation;
export default function TonSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return <SendRowComment {...rest} transaction={transaction as TonTransaction} />;
}
