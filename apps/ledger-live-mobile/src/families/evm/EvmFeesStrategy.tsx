import { getEstimatedFees } from "@ledgerhq/coin-evm/lib/logic";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { log } from "@ledgerhq/logs";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useCallback, useEffect, useState } from "react";
import { ScreenName } from "../../const";
import { EvmNetworkFeeInfo } from "./EvmNetworkFeesInfo";
import SelectFeesStrategy from "./SelectFeesStrategy";
import { SendRowsFeeProps as Props, StrategyWithCustom } from "./types";

const getCustomStrategyFees = (transaction: Transaction): BigNumber | null => {
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
  navigation,
  route,
  shouldPrefillEvmGasOptions = true,
  ...props
}: Props<Transaction>) {
  const account = getMainAccount(accountProp, parentAccount);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);

  const [gasOptions, error, loading] = useGasOptions({
    currency: account.currency,
    transaction,
    interval: account.currency.blockAvgTime ? account.currency.blockAvgTime * 1000 : undefined,
  });

  if (error) {
    log("error", error.message);
  }

  useEffect(() => {
    if (shouldPrefillEvmGasOptions) {
      const updatedTransaction = bridge.updateTransaction(transaction, {
        ...transaction,
        gasOptions,
      });
      setTransaction(updatedTransaction);
    }
  }, [bridge, setTransaction, gasOptions, transaction, shouldPrefillEvmGasOptions]);

  /**
   * When the user edits the custom fees, we save the related transaction patch
   * in order to reapply it the next time the user selects the saved custom
   * strategy entry in the strategy list.
   * This is done in order to display the correct fees value for the saved custom
   * entry in the fees strategy list.
   * We don't need to save the transaction patch for other fees strategies since
   * the transaction is already updated with the correct fee data retrieved from
   * the gasTracker in `prepareTransaction`.
   * cf. (as of 21-09-2023) https://github.com/LedgerHQ/ledger-live/blob/e87c4c2d879fb9322cd2849f2d34c3be9e500a1e/libs/coin-evm/src/prepareTransaction.ts#L190-L202
   * But since the custom strategy is handled locally by the client, if we don't
   * save the patch (including updated fee data) and only update the `feesStrategy`
   * field, the fees value displayed in the fees strategy for the custom entry
   * will be the one from the last selected strategy (e.g. slow, medium, fast).
   */
  const [customStrategyTransactionPatch, setCustomStrategyTransactionPatch] =
    useState<Partial<Transaction>>();

  const onFeesSelected = useCallback(
    ({ feesStrategy }: { feesStrategy: StrategyWithCustom }) => {
      const bridge = getAccountBridge<Transaction>(account, parentAccount);

      const patch: Partial<Transaction> =
        feesStrategy === "custom" && customStrategyTransactionPatch
          ? customStrategyTransactionPatch
          : {
              feesStrategy,
            };

      setTransaction(bridge.updateTransaction(transaction, { ...patch, gasOptions }));
    },
    [
      setTransaction,
      account,
      parentAccount,
      transaction,
      customStrategyTransactionPatch,
      gasOptions,
    ],
  );

  const openCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.EvmCustomFees, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      setTransaction,
      setCustomStrategyTransactionPatch,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction, setTransaction]);

  if (loading) {
    return <InfiniteLoader size={32} />;
  }

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
      customFees={getCustomStrategyFees({
        ...transaction,
        ...customStrategyTransactionPatch,
      } as Transaction)}
      onStrategySelect={onFeesSelected}
      onCustomFeesPress={openCustomFees}
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      NetworkFeesInfoComponent={EvmNetworkFeeInfo}
    />
  );
}
