import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  CosmosAccount,
  Transaction as CosmosTransaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { ScreenName } from "~/const";
import CosmosFamilySendRowsCustomComponent from "./shared/CosmosFamilySendRowsCustomComponent";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;
export default function CosmosSendRowsCustom({ account, transaction }: Props) {
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.CosmosFamilyEditMemo, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      account: account as CosmosAccount,
      transaction: transaction as CosmosTransaction,
    });
  }, [navigation, route.params, account, transaction]);
  return (
    <CosmosFamilySendRowsCustomComponent
      transaction={transaction as CosmosTransaction}
      editMemo={editMemo}
    />
  );
}
