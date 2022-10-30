import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  EIP1559ShouldBeUsed,
  getGasLimit,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import type { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import type { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import { ScreenName } from "../../const";

const getCustomStrategy = (
  transaction: Transaction,
  currency: CryptoCurrency,
) => {
  if (transaction.feesStrategy === "custom") {
    return {
      label: "custom",
      forceValueLabel: null,
      amount: transaction.gasPrice,
      displayedAmount: EIP1559ShouldBeUsed(currency)
        ? transaction.maxFeePerGas?.multipliedBy(getGasLimit(transaction))
        : transaction.gasPrice?.multipliedBy(getGasLimit(transaction)),
      userGasLimit: getGasLimit(transaction),
    };
  }

  return null;
};

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction?: Result["setTransaction"];
  status?: Result["status"];
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

export default function EthereumFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  status,
  route,
  ...props
}: Props) {
  const { currency } = getMainAccount(account, parentAccount);
  const defaultStrategies = useFeesStrategy(transaction);
  const [customStrategy, setCustomStrategy] = useState(
    getCustomStrategy(transaction, currency),
  );
  const strategies = useMemo(
    () =>
      customStrategy
        ? [...defaultStrategies, customStrategy]
        : defaultStrategies,
    [defaultStrategies, customStrategy],
  );
  useEffect(() => {
    const newCustomStrategy = getCustomStrategy(transaction, currency);

    if (newCustomStrategy) {
      setCustomStrategy(newCustomStrategy);
    }
  }, [transaction, setCustomStrategy, currency]);
  const onFeesSelected = useCallback(
    ({ amount, label, userGasLimit, extra }) => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          maxFeePerGas: extra?.maxFeePerGas,
          maxPriorityFeePerGas: extra?.maxPriorityFeePerGas,
          feesStrategy: label,
          userGasLimit: userGasLimit || transaction.userGasLimit,
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
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction,
      status,
    });
  }, [
    navigation,
    route.params,
    account.id,
    parentAccount,
    transaction,
    setTransaction,
    status,
  ]);

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
