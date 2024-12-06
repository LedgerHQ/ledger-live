import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import type {
  AlgorandAccount,
  Transaction as AlgorandTransaction,
} from "@ledgerhq/live-common/families/algorand/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { GenericMemoTagSummary } from "~/newArch/features/MemoTag/components/GenericMemoTagSummary";

type Navigation = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
>;

type Props = {
  account: Account;
  transaction: Transaction;
} & Navigation;

export default function AlgorandMemoTagSummary(props: Props) {
  const { account } = props;
  const transaction = props.transaction as AlgorandTransaction;
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();

  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.AlgorandEditMemo, {
      ...route.params,
      account: account as AlgorandAccount,
      accountId: account.id,
      parentId: undefined,
      transaction,
    });
  }, [navigation, route.params, account, transaction]);

  return <GenericMemoTagSummary memoTag={transaction.memo ?? ""} editMemo={editMemo} />;
}
