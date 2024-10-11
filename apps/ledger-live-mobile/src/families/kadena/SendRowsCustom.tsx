import { Transaction as KadenaTransaction } from "@ledgerhq/live-common/families/kadena/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SendRowChainID from "./SendRowChainId";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  transaction: Transaction;
  account: Account;
} & Navigation;
export default function KadenaSendRowsCustom(props: Props) {
  const { transaction, ...rest } = props;
  return <SendRowChainID {...rest} transaction={transaction as KadenaTransaction} />;
}
