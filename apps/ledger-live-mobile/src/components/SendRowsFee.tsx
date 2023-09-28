import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { CompositeScreenProps } from "@react-navigation/native";

import perFamily from "../generated/SendRowsFee";
import type { StackNavigatorProps } from "./RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import { ScreenName } from "../const";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  status?: TransactionStatus;
  setTransaction: (..._: Array<Transaction>) => void;
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
  ...props
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);

  // eslint-disable-next-line no-prototype-builtins
  if (perFamily.hasOwnProperty(mainAccount.currency.family)) {
    const C = perFamily[mainAccount.currency.family as keyof typeof perFamily];
    return (
      <C
        {...props}
        setTransaction={setTransaction}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        navigation={navigation}
        route={route}
      />
    );
  }

  return null;
};
