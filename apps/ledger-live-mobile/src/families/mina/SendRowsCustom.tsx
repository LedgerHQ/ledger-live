import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction as MinaTransaction } from "@ledgerhq/live-common/families/mina/types";
import SendRowMemo from "./SendRowMemo";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  transaction: Transaction;
  account: Account;
} & Navigation;
export default function MinaSendRowsCustom(props: Props) {
  return (
    <>
      <SendRowMemo {...props} transaction={props.transaction as MinaTransaction} />
    </>
  );
}
