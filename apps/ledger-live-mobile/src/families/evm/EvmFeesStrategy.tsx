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
import { ScreenName } from "~/const";
import { EvmNetworkFeeInfo } from "./EvmNetworkFeesInfo";
import SelectFeesStrategy from "./SelectFeesStrategy";
import { SendRowsFeeProps as Props, StrategyWithCustom } from "./types";

const getCustomStrategyFees = (transaction: Transaction): BigNumber | null => {
  if (transaction.feesStrategy === "custom") {
    return getEstimatedFees(transaction);
  }

  return null;
};

/**
 * ⚠️ In the context of some UI flows like the swap, the main component might
 * be providing a navigation after updating the transaction
 * (i.e: calling `setTransaction`).
 * One should therefore be careful regarding this side effect when calling
 * `setTransaction`.
 */
export default function EvmFeesStrategy({
  account,
  parentAccount,
  transaction,
  setTransaction,
  navigation,
  route,
  shouldPrefillEvmGasOptions = true,
  ...props
}: Props<Transaction>) {
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge: AccountBridge<Transaction> = getAccountBridge(mainAccount);

  const [gasOptions, error, loading] = useGasOptions({
    currency: mainAccount.currency,
    transaction,
    interval: mainAccount.currency.blockAvgTime
      ? mainAccount.currency.blockAvgTime * 1000
      : undefined,
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

  /**
   * Commenting out this useEffect because it is causing an infinite
   * rerender of the summary screen in the swap flow.
   * This hook has been added originally to have the custom fees strategy
   * selected by default when the user comes back to the summary screen after having
   * customized the fees in the custom fees screen.
   */
  /**
   * If the customStrategyTransactionPatch is present, this means the custom
   * fee has been edited by the user. In this case, we need to update the
   * transaction with the new fee data.
   * This also selects the new "custom" strategy in the fees strategy list.
   */
  // useEffect(() => {
  //   if (!customStrategyTransactionPatch) {
  //     return;
  //   }

  //   const updatedTransaction = bridge.updateTransaction(transaction, {
  //     ...customStrategyTransactionPatch,
  //   });

  //   setTransaction(updatedTransaction);
  // }, [
  //   setTransaction,
  //   account,
  //   parentAccount,
  //   transaction,
  //   customStrategyTransactionPatch,
  //   gasOptions,
  //   bridge,
  // ]);

  /**
   * If the feesStrategy is "custom" but no customStrategyTransactionPatch is
   * present, this means the custom fee has been selected by default ahead in
   * the flow (e.g. if the tx comes from a live-app or from the edit tx flow).
   * In this case, we need to create the customStrategyTransactionPatch from
   * the transaction fee data.
   */
  useEffect(() => {
    if (customStrategyTransactionPatch || transaction.feesStrategy !== "custom") {
      return;
    }

    const patchCommon: Partial<Transaction> = {
      feesStrategy: "custom",
      gasLimit: transaction.gasLimit,
      customGasLimit: transaction.customGasLimit,
    };

    const patchTypeSpecific: Partial<Transaction> =
      transaction.type === 2
        ? {
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
            maxFeePerGas: transaction.maxFeePerGas,
          }
        : { gasPrice: transaction.gasPrice };

    // note: we need to cast the patch to Partial<Transaction> because of a weird
    // missmatch with the type of the `mode` property
    const newCustomStrategyTransactionPatch: Partial<Transaction> = {
      ...patchCommon,
      ...patchTypeSpecific,
    } as Partial<Transaction>;

    setCustomStrategyTransactionPatch(newCustomStrategyTransactionPatch);
  }, [transaction, customStrategyTransactionPatch]);

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
      gasOptions,
      setTransaction,
      setCustomStrategyTransactionPatch,
    });
  }, [
    navigation,
    route.params,
    account.id,
    parentAccount,
    gasOptions,
    transaction,
    setTransaction,
  ]);

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
      account={mainAccount}
      parentAccount={parentAccount}
      transaction={transaction}
      NetworkFeesInfoComponent={EvmNetworkFeeInfo}
    />
  );
}
