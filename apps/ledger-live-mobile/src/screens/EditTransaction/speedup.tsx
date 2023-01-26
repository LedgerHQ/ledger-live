import React from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { useNavigation } from "@react-navigation/native";
import {
  EIP1559ShouldBeUsed,
  fromTransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import { SafeAreaView } from "react-native-safe-area-context";
import { Account } from "@ledgerhq/types-live";

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

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const strategies = useFeesStrategy(transactionToEdit);

  const disabledStrategies = strategies
    .filter(strategy => {
      const { currency } = account as Account;
      if (EIP1559ShouldBeUsed(currency)) {
        return (
          strategy.extra!.maxPriorityFeePerGas >
          transactionToEdit.maxPriorityFeePerGas!
        );
      }

      return strategy.amount > transactionToEdit.gasPrice!;
    })
    .map(strategy => strategy.label);

  const openCustomFees = () => {
    return customFeesNavigation.navigate(ScreenName.EthereumCustomFees, {
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
    // setTransaction
  };

  const onContinue = () => {
    // redirect to sign transaction page
    sendSummaryNavigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SignTransactionSummary,
    });
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
