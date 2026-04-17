import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import React from "react";
import { ScreenName } from "~/const";
import { useSendRowsFee } from "~/families/hooks";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import type { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  status?: TransactionStatusCommon;
  setTransaction: (..._: Array<Transaction>) => void;
  transactionToUpdate?: Transaction;
  disabledStrategies?: Array<string>;
  shouldPrefillEvmGasOptions?: boolean;
} & BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
  route,
  setTransaction,
  status,
  ...props
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = useSendRowsFee(mainAccount.currency.family) as React.ComponentType<any> | undefined;

  if (!Component) return null;

  return (
    <Component
      {...props}
      setTransaction={setTransaction}
      transaction={transaction}
      account={account}
      parentAccount={parentAccount}
      navigation={navigation}
      route={route}
      status={status}
    />
  );
};
