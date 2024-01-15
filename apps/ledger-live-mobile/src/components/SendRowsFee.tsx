import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import { CompositeScreenProps } from "@react-navigation/native";
import React from "react";
import { ScreenName } from "~/const";
import perFamily from "../generated/SendRowsFee";
import type { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import type { StackNavigatorProps } from "./RootNavigator/types/helpers";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  status?: TransactionStatusCommon;
  setTransaction: (..._: Array<Transaction>) => void;
  transactionToUpdate?: Transaction;
  disabledStrategies?: Array<string>;
  shouldPrefillEvmGasOptions?: boolean;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
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

  const hasFamilyProperty = Object.prototype.hasOwnProperty.call(
    perFamily,
    mainAccount.currency.family,
  );

  if (hasFamilyProperty) {
    const Component = perFamily[mainAccount.currency.family as keyof typeof perFamily];
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
