import { useState, useRef, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import type { CustomFeeConfig } from "../../../../bridge/descriptor/types";
import { getAccountBridge } from "../../../../bridge/impl";
import { hasInsufficientBalanceErrorName } from "../utils/customFeeUtils";

type UseBridgeFeeEstimationParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  values: Record<string, string>;
  allInputsValid: boolean;
  estimatedFeesFromInputs: BigNumber | null;
  customFeeConfig: CustomFeeConfig | null;
}>;

type UseBridgeFeeEstimationResult = Readonly<{
  estimatedFeesFromBridge: BigNumber | null;
  bridgeHasInsufficientBalance: boolean;
  /**
   * Non-null when a bridge estimation is needed (inputs are valid but no local
   * shortcut is available). Used downstream to gate fiat display
   */
  bridgeEstimationKey: string | null;
}>;

type BridgeEstimationResult = Readonly<{
  key: string;
  estimatedFees: BigNumber | null;
  hasInsufficientBalance: boolean;
}>;

function getTransactionStringField(transaction: Transaction, key: string): string | null {
  const value = Reflect.get(transaction, key);
  return typeof value === "string" ? value : null;
}

export function useBridgeFeeEstimation({
  account,
  parentAccount,
  transaction,
  values,
  allInputsValid,
  estimatedFeesFromInputs,
  customFeeConfig,
}: UseBridgeFeeEstimationParams): UseBridgeFeeEstimationResult {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const [bridgeEstimationResult, setBridgeEstimationResult] =
    useState<BridgeEstimationResult | null>(null);

  const lastBridgeEstimationKeyRef = useRef<string | null>(null);
  const inFlightBridgeEstimationKeyRef = useRef<string | null>(null);
  const bridgeEstimationRequestIdRef = useRef(0);

  const feeCurrencyAccountId = getTransactionStringField(transaction, "feeCurrencyAccountId");
  const feeCurrency = getTransactionStringField(transaction, "feeCurrency");
  const feeCurrencyUnwrapped = getTransactionStringField(transaction, "feeCurrencyUnwrapped");

  const bridgeEstimationKey = useMemo(() => {
    if (!customFeeConfig || !allInputsValid || estimatedFeesFromInputs) return null;

    const normalizedValues = Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
    const amount = transaction.amount ?? new BigNumber(0);

    return JSON.stringify({
      accountId: mainAccount.id,
      family: transaction.family,
      recipient: transaction.recipient ?? "",
      amount: amount.toFixed(),
      feeCurrencyAccountId,
      feeCurrency,
      feeCurrencyUnwrapped,
      values: normalizedValues,
    });
  }, [
    allInputsValid,
    customFeeConfig,
    estimatedFeesFromInputs,
    feeCurrency,
    feeCurrencyAccountId,
    feeCurrencyUnwrapped,
    mainAccount.id,
    transaction.amount,
    transaction.family,
    transaction.recipient,
    values,
  ]);

  if (
    customFeeConfig &&
    bridgeEstimationKey &&
    lastBridgeEstimationKeyRef.current !== bridgeEstimationKey &&
    inFlightBridgeEstimationKeyRef.current !== bridgeEstimationKey
  ) {
    lastBridgeEstimationKeyRef.current = bridgeEstimationKey;
    inFlightBridgeEstimationKeyRef.current = bridgeEstimationKey;
    bridgeEstimationRequestIdRef.current += 1;
    const requestId = bridgeEstimationRequestIdRef.current;

    queueMicrotask(async () => {
      try {
        const bridge = await getAccountBridge(account, parentAccount ?? undefined);
        const patch = customFeeConfig.buildTransactionPatch(values);
        const nextTransaction = bridge.updateTransaction(
          transaction,
          patch as Partial<Transaction>,
        );
        const preparedTx = await bridge.prepareTransaction(mainAccount, nextTransaction);
        const nextStatus = await bridge.getTransactionStatus(mainAccount, preparedTx);
        if (bridgeEstimationRequestIdRef.current !== requestId) return;

        const insufficientFromBridge = Object.entries(nextStatus.errors ?? {}).some(
          ([key, error]) =>
            key === "insufficientBalanceFees" || hasInsufficientBalanceErrorName(error),
        );
        setBridgeEstimationResult({
          key: bridgeEstimationKey,
          estimatedFees: nextStatus.estimatedFees ?? new BigNumber(0),
          hasInsufficientBalance: insufficientFromBridge,
        });
      } catch (error) {
        if (
          bridgeEstimationRequestIdRef.current === requestId &&
          error &&
          hasInsufficientBalanceErrorName(error as Error)
        ) {
          setBridgeEstimationResult({
            key: bridgeEstimationKey,
            estimatedFees: null,
            hasInsufficientBalance: true,
          });
        }
      } finally {
        if (bridgeEstimationRequestIdRef.current === requestId) {
          inFlightBridgeEstimationKeyRef.current = null;
        }
      }
    });
  }

  const hasCurrentBridgeEstimationResult = bridgeEstimationResult?.key === bridgeEstimationKey;

  return {
    estimatedFeesFromBridge: hasCurrentBridgeEstimationResult
      ? bridgeEstimationResult.estimatedFees
      : null,
    bridgeHasInsufficientBalance: hasCurrentBridgeEstimationResult
      ? bridgeEstimationResult.hasInsufficientBalance
      : false,
    bridgeEstimationKey,
  };
}
