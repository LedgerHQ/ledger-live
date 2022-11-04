import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import perFamily from "../generated/SendRowsCustom";
import type {
  BaseComposite,
  StackNavigatorProps,
} from "./RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { LendingEnableFlowParamsList } from "./RootNavigator/types/LendingEnableFlowNavigator";
import type { LendingSupplyFlowNavigatorParamList } from "./RootNavigator/types/LendingSupplyFlowNavigator";
import type { LendingWithdrawFlowNavigatorParamList } from "./RootNavigator/types/LendingWithdrawFlowNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import { ScreenName } from "../const";

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

export default ({
  transaction,
  account,
  navigation,
  route,
}: {
  transaction: Transaction;
  account: Account;
} & Navigation) => {
  const C = perFamily[account.currency.family as keyof typeof perFamily];
  return C ? (
    <C
      transaction={transaction}
      account={account}
      navigation={navigation}
      route={route}
    />
  ) : null;
};
