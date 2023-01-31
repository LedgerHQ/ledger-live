import React from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { useNavigation } from "@react-navigation/native";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import { StyleSheet, View } from "react-native";

import { ScreenName } from "../../../const";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import SelectFeesStrategy from "../../../components/SelectFeesStrategy";
import Button from "../../../components/Button";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.SpeedUpTransaction
>;

export function SpeedupTransaction({ route }: Props) {
  const navigation = useNavigation<
    | StackNavigatorNavigation<
        EthereumEditTransactionParamList,
        ScreenName.EthereumCustomFees
      >
    | StackNavigatorNavigation<
        EthereumEditTransactionParamList,
        ScreenName.SendSummary
      >
  >();

  const { operation, account, parentAccount } = route.params;

  const bridge = getAccountBridge(account, parentAccount as Account);

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction } = useBridgeTransaction<Transaction>(
    () => {
      return {
        account,
        parentAccount: parentAccount as Account,
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
    navigation.navigate(ScreenName.EthereumCustomFees, {
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
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction: transactionToEdit,
      currentNavigation: ScreenName.SpeedUpTransaction,
      nextNavigation: ScreenName.SendSelectDevice,
      hideFees: true,
    });
  };

  const onContinue = () => {
    // redirect to sign transaction page
  };

  return (
    <>
      <SelectFeesStrategy
        strategies={strategies}
        account={account}
        parentAccount={parentAccount as Account}
        transaction={transactionToEdit}
        onStrategySelect={onFeeStrategySelected}
        onCustomFeesPress={openCustomFees}
        disabledStrategies={disabledStrategies}
      />

      <View style={styles.flex}>
        <Button
          type="main"
          containerStyle={{ flexGrow: 1 }}
          onPress={onContinue}
        >
          Continue
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  container: {
    flex: 1,
  },
  sectionSeparator: {
    marginTop: 16,
  },
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
