import React, { useCallback, useState, useMemo, useEffect } from "react";
import type { Transaction as EthereumTransaction } from "@ledgerhq/live-common/families/ethereum/types";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  EIP1559ShouldBeUsed,
  getGasLimit,
} from "@ledgerhq/live-common/families/ethereum/transaction";
import { FeeStrategy } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { getEnv } from "@ledgerhq/live-env";

import SelectFeesStrategy from "../../components/SelectFeesStrategy";
import { SendRowsFeeProps as Props } from "./types";
import { ScreenName } from "../../const";

const getCustomStrategy = (
  transaction: EthereumTransaction,
  currency: CryptoCurrency,
): (FeeStrategy & { userGasLimit?: BigNumber }) | null => {
  if (transaction.feesStrategy === "custom") {
    return {
      label: "custom",
      amount: transaction.gasPrice || new BigNumber(0),
      displayedAmount: EIP1559ShouldBeUsed(currency)
        ? transaction.maxFeePerGas?.multipliedBy(getGasLimit(transaction))
        : transaction.gasPrice?.multipliedBy(getGasLimit(transaction)),
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
}: Props<EthereumTransaction>) {
  const { currency } = getMainAccount(account, parentAccount);
  const { operation } = route.params;
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

  const disabledStrategies = useMemo(() => {
    return operation && isEditableOperation(account, operation)
      ? strategies
          .filter(strategy => {
            if (EIP1559ShouldBeUsed(currency)) {
              const oldMaxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
              const oldMaxFeePerGas = transaction.maxFeePerGas;
              const maxPriorityFeeGap: number = getEnv(
                "EDIT_TX_EIP1559_MAXPRIORITYFEE_GAP_SPEEDUP_FACTOR",
              );
              const strategyMaxPriorityFeePerGas =
                strategy.extra?.maxPriorityFeePerGas;
              const strategyMaxFeePerGas = strategy.extra?.maxFeePerGas;

              const disabled =
                strategy.disabled ||
                strategyMaxPriorityFeePerGas?.isLessThan(
                  BigNumber(oldMaxPriorityFeePerGas || 0).times(
                    1 + maxPriorityFeeGap,
                  ),
                ) ||
                strategyMaxFeePerGas?.isLessThan(
                  BigNumber(oldMaxFeePerGas || 0).plus(
                    BigNumber(oldMaxPriorityFeePerGas || 0).times(
                      maxPriorityFeeGap,
                    ),
                  ),
                );

              return disabled;
            }

            const gaspriceGap: number = getEnv(
              "EDIT_TX_NON_EIP1559_GASPRICE_GAP_SPEEDUP_FACTOR",
            );

            const oldGasPrice = transaction.gasPrice;

            const disabled =
              strategy.disabled ||
              strategy.amount.isLessThan(
                BigNumber(oldGasPrice || 0).times(1 + gaspriceGap),
              );

            return disabled;
          })
          .map(strategy => strategy.label)
      : [];
  }, [
    account,
    currency,
    operation,
    strategies,
    transaction.gasPrice,
    transaction.maxFeePerGas,
    transaction.maxPriorityFeePerGas,
  ]);

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
    });
  }, [
    navigation,
    route.params,
    account.id,
    parentAccount,
    transaction,
    setTransaction,
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
      disabledStrategies={disabledStrategies}
    />
  );
}
