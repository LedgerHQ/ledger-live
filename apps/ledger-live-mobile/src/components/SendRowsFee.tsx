import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import React from "react";
import { ScreenName } from "~/const";
import perFamily from "../generated/SendRowsFee";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import type { BaseComposite, StackNavigatorProps } from "./RootNavigator/types/helpers";

const isSupportedFamily = (family: string): family is keyof typeof perFamily =>
  Object.prototype.hasOwnProperty.call(perFamily, family);

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
  const family = mainAccount.currency.family;

  if (isSupportedFamily(family)) {
    const Component = perFamily[family];
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
  }

  return null;
};
