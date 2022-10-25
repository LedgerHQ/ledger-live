import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EthereumTransaction } from "@ledgerhq/live-common/families/ethereum/types";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import type { CompositeScreenProps } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../const";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: (..._: Array<Transaction>) => void;
} & CompositeScreenProps<
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
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

const getCustomStrategy = (
  transaction: EthereumTransaction,
): (FeeStrategy & { userGasLimit?: BigNumber | null }) | null => {
  if (transaction.feesStrategy === "custom") {
    return {
      label: "custom",
      amount: transaction?.gasPrice || BigNumber(0),
      displayedAmount: transaction.gasPrice?.multipliedBy(
        getGasLimit(transaction),
      ),
      userGasLimit: getGasLimit(transaction),
    };
  }

  return null;
};

export default function EthereumFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  route,
  ...props
}: Props) {
  const defaultStrategies = useFeesStrategy(transaction as EthereumTransaction);
  const [customStrategy, setCustomStrategy] = useState(
    getCustomStrategy(transaction as EthereumTransaction),
  );
  const strategies = useMemo(
    () =>
      customStrategy
        ? [...defaultStrategies, customStrategy]
        : defaultStrategies,
    [defaultStrategies, customStrategy],
  );
  useEffect(() => {
    const newCustomStrategy = getCustomStrategy(
      transaction as EthereumTransaction,
    );

    if (newCustomStrategy) {
      setCustomStrategy(newCustomStrategy);
    }
  }, [transaction, setCustomStrategy]);
  const onFeesSelected = useCallback(
    ({ amount, label, userGasLimit }) => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          feesStrategy: label,
          userGasLimit:
            userGasLimit || (transaction as EthereumTransaction).userGasLimit,
        }),
      );
    },
    [setTransaction, account, parentAccount, transaction],
  );
  const openCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.EthereumCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction: transaction as EthereumTransaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);
  return (
    <SelectFeesStrategy
      {...props}
      strategies={strategies}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
    />
  );
}
