import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import React, { useCallback, useEffect, useState } from "react";
import SelectFeesStrategy from "./SelectFeesStrategy";
import { ScreenName } from "../../const";
import { EvmNetworkFeeInfo } from "./EvmNetworkFeesInfo";
import { SendRowsFeeProps as Props } from "./types";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { useNavigation } from "@react-navigation/core";

const getCustomStrategy = (transaction: Transaction): BigNumber | null => {
  if (transaction.feesStrategy === "custom") {
    return getEstimatedFees(transaction);
  }

  return null;
};

export default function EvmFeesStrategy({
  account: accountProp,
  parentAccount,
  transaction,
  setTransaction,
  route,
  ...props
}: Props<Transaction>) {
  const account = getMainAccount(accountProp, parentAccount);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);

  const [gasOptions, error] = useGasOptions({
    currency: account.currency,
    transaction,
    interval: account.currency.blockAvgTime ? account.currency.blockAvgTime * 1000 : undefined,
  });

  if (error) {
    log("error", error.message);
  }

  useEffect(() => {
    const updatedTransaction = bridge.updateTransaction(transaction, {
      ...transaction,
      gasOptions,
    });
    setTransaction(updatedTransaction);
  }, [bridge, setTransaction, gasOptions, transaction]);

  const [customStrategy, setCustomStrategy] = useState(getCustomStrategy(transaction));

  useEffect(() => {
    const newCustomStrategy = getCustomStrategy(transaction);

    if (newCustomStrategy) {
      setCustomStrategy(newCustomStrategy);
    }
  }, [transaction, setCustomStrategy]);

  const onFeesSelected = useCallback(
    ({ feesStrategy }) => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          feesStrategy,
        }),
      );
    },
    [setTransaction, account, parentAccount, transaction],
  );

  const navigation = useNavigation<any>();

  const openCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.EvmCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction, setTransaction]);

  /**
   * If no gasOptions available, this means this currency does not have a
   * gasTracker. Hence, we do not display the fee fields.
   */
  if (!gasOptions) {
    return null;
  }

  return (
    <SelectFeesStrategy
      {...props}
      gasOptions={gasOptions}
      customFees={customStrategy}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      NetworkFeesInfoComponent={EvmNetworkFeeInfo}
    />
  );
}
