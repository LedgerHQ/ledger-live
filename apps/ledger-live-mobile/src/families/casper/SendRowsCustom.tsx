import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import SendRowTransferId from "./SendRowTransferId";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
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
export default function CasperSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return (
    <>
      <SendRowTransferId {...rest} transaction={transaction as CasperTransaction} />
    </>
  );
}
