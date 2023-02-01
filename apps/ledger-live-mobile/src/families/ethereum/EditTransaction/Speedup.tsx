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
import { Trans } from "react-i18next";

import { ScreenName } from "../../../const";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import SelectFeesStrategy, {
  SelectFeeStrategy,
} from "../../../components/SelectFeesStrategy";
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

  if (!transaction) {
    return null;
  }

  const disabledStrategies = strategies
    .filter(strategy => {
      // TODO: define what is the correct calculation for this
      return (
        strategy.extra!.maxPriorityFeePerGas <
        transactionToEdit.maxPriorityFeePerGas!
      );
    })
    .map(strategy => strategy.label);

  const openCustomFees = () => {
    navigation.navigate(ScreenName.EthereumCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SpeedUpTransaction,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction,
    });
  };

  const onFeeStrategySelected = (strategy: SelectFeeStrategy) => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        feesStrategy: strategy.label,
        maxFeePerGas: strategy.extra?.maxFeePerGas,
        maxPriorityFeePerGas: strategy.extra?.maxPriorityFeePerGas,
      }),
    );
  };

  const onContinue = () => {
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SpeedUpTransaction,
      nextNavigation: ScreenName.SendSelectDevice,
      hideFees: true,
    });
  };

  return transaction ? (
    <>
      <SelectFeesStrategy
        strategies={strategies}
        account={account}
        parentAccount={parentAccount as Account}
        transaction={transaction}
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
          <Trans i18nKey={"common.continue"} />
        </Button>
      </View>
    </>
  ) : null;
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
