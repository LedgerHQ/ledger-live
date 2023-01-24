import React from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { useNavigation } from "@react-navigation/native";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";

import { ScreenName } from "../../const";
import { EthereumEditTransactionParamList } from "../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.SpeedUpTransaction
>;

export function SpeedupTransaction({ route }: Props) {
  const customFeesNavigation = useNavigation<any>();
  const { operation, account } = route.params;

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const strategies = useFeesStrategy(transactionToEdit);

  const openCustomFees = () => {
    return customFeesNavigation.navigate(ScreenName.EthereumCustomFees, {
      ...route.params,
      account,
      accountId: account.id,
      parentId: null,
      transaction: transactionToEdit,
      currentNavigation: ScreenName.SpeedUpTransaction,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction: () => null,
    });
  };

  const onFeeStrategySelected = () => {
    //
  };

  return (
    <SelectFeesStrategy
      strategies={strategies}
      account={account}
      transaction={transactionToEdit}
      onStrategySelect={onFeeStrategySelected}
      onCustomFeesPress={openCustomFees}
      disabledStrategies={["lol"]}
    />
  );
}
