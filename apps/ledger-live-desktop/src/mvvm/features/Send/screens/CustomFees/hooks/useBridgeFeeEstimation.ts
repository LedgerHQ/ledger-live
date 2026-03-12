import { useState, useRef, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CustomFeeConfig } from "@ledgerhq/live-common/bridge/descriptor";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import BigNumber from "bignumber.js";
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

  const [estimatedFeesFromBridge, setEstimatedFeesFromBridge] = useState<BigNumber | null>(null);
  const [bridgeHasInsufficientBalance, setBridgeHasInsufficientBalance] = useState(false);

  const lastBridgeEstimationKeyRef = useRef<string | null>(null);
  const inFlightBridgeEstimationKeyRef = useRef<string | null>(null);
  const bridgeEstimationRequestIdRef = useRef(0);

  const bridgeEstimationKey = useMemo(() => {
    if (!customFeeConfig || !allInputsValid || estimatedFeesFromInputs) return null;

    const normalizedValues = Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
    const amount = transaction.amount ?? new BigNumber(0);

    return JSON.stringify({
      accountId: mainAccount.id,
      family: transaction.family,
      recipient: transaction.recipient ?? "",
      amount: amount.toFixed(),
      values: normalizedValues,
    });
  }, [
    allInputsValid,
    customFeeConfig,
    estimatedFeesFromInputs,
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
    setBridgeHasInsufficientBalance(false);
    bridgeEstimationRequestIdRef.current += 1;
    const requestId = bridgeEstimationRequestIdRef.current;
    const bridge = getAccountBridge(account, parentAccount ?? undefined);
    const patch = customFeeConfig.buildTransactionPatch(values);
    const nextTransaction = bridge.updateTransaction(transaction, patch as Partial<Transaction>);

    queueMicrotask(async () => {
      try {
        const preparedTx = await bridge.prepareTransaction(mainAccount, nextTransaction);
        const nextStatus = await bridge.getTransactionStatus(mainAccount, preparedTx);
        if (bridgeEstimationRequestIdRef.current !== requestId) return;
        setEstimatedFeesFromBridge(nextStatus.estimatedFees ?? new BigNumber(0));

        const insufficientFromBridge = Object.entries(nextStatus.errors ?? {}).some(
          ([key, error]) =>
            key === "insufficientBalanceFees" || hasInsufficientBalanceErrorName(error),
        );
        setBridgeHasInsufficientBalance(insufficientFromBridge);
      } catch (error) {
        if (
          bridgeEstimationRequestIdRef.current === requestId &&
          error &&
          hasInsufficientBalanceErrorName(error as Error)
        ) {
          setBridgeHasInsufficientBalance(true);
        }
      } finally {
        if (bridgeEstimationRequestIdRef.current === requestId) {
          inFlightBridgeEstimationKeyRef.current = null;
        }
      }
    });
  }

  return { estimatedFeesFromBridge, bridgeHasInsufficientBalance, bridgeEstimationKey };
}
