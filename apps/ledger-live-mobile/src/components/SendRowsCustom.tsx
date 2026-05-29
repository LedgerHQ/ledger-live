import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useSendRowsCustom } from "~/families/hooks";
import type { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

export default ({
  transaction,
  account,
  navigation,
  route,
}: {
  transaction: Transaction;
  account: Account;
} & Navigation) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = useSendRowsCustom(account.currency.family) as React.ComponentType<any> | undefined;
  return C ? (
    <C transaction={transaction} account={account} navigation={navigation} route={route} />
  ) : null;
};
