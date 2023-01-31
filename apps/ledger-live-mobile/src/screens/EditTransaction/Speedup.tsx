import React from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { useNavigation } from "@react-navigation/native";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import { NavigatorName, ScreenName } from "../../const";
import { EthereumEditTransactionParamList } from "../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import Button from "../../components/Button";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.SpeedUpTransaction
>;

export function SpeedupTransaction({ route }: Props) {
  const customFeesNavigation =
    useNavigation<
      StackNavigatorNavigation<
        SendFundsNavigatorStackParamList,
        ScreenName.EthereumCustomFees
      >
    >();

  const sendSummaryNavigation = useNavigation<any>();

  const { operation, account } = route.params;
  const bridge = getAccountBridge(account, null);

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction } = useBridgeTransaction<Transaction>(
    () => {
      return {
        account,
        parentAccount: null,
        transaction: transactionToEdit,
      };
    },
  );

  const strategies = useFeesStrategy(transactionToEdit);

  const disabledStrategies = strategies
    .filter(strategy => {
      return (
        strategy.extra!.maxPriorityFeePerGas >
        transactionToEdit.maxPriorityFeePerGas!
      );
    })
    .map(strategy => strategy.label);

  const openCustomFees = () => {
    customFeesNavigation.navigate(ScreenName.EthereumCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: undefined,
      transaction: transactionToEdit,
      currentNavigation: ScreenName.SpeedUpTransaction,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction: () => null,
    });
  };

  const onFeeStrategySelected = () => {
    setTransaction(bridge.updateTransaction(transaction, transactionToEdit));
    sendSummaryNavigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: undefined,
      transaction: transactionToEdit,
      nextNavigation: ScreenName.SendSelectDevice,
      hideFees: true,
    });
  };

  const onContinue = () => {
    // redirect to sign transaction page
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <SelectFeesStrategy
        strategies={strategies}
        account={account}
        transaction={transactionToEdit}
        onStrategySelect={onFeeStrategySelected}
        onCustomFeesPress={openCustomFees}
        disabledStrategies={disabledStrategies}
      />
      <Button onPress={onContinue}>Continue</Button>
    </SafeAreaView>
  );
}
