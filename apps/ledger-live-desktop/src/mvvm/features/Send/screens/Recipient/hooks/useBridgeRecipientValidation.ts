import { useState, useMemo, useCallback, useRef } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { BridgeValidationErrors, BridgeValidationWarnings } from "../types";
import { applyMemoToTransaction } from "@ledgerhq/live-common/bridge/descriptor";
import type { Memo } from "../../../types";

export type BridgeRecipientValidationResult = {
  errors: BridgeValidationErrors;
  warnings: BridgeValidationWarnings;
  isLoading: boolean;
  status: TransactionStatus | null;
  cleanup: () => void;
};

type UseBridgeRecipientValidationProps = {
  recipient: string;
  account: AccountLike | null;
  parentAccount?: Account | null;
  memo?: Memo;
  enabled?: boolean;
};

const DEBOUNCE_DELAY = 300;

/**
 * Hook to validate recipient address using the bridge transaction status.
 * This hook leverages the existing bridge infrastructure to get
 * recipient and sender validation errors/warnings.
 */
export function useBridgeRecipientValidation({
  recipient,
  account,
  parentAccount,
  memo,
  enabled = true,
}: UseBridgeRecipientValidationProps): BridgeRecipientValidationResult {
  const [validationState, setValidationState] = useState<{
    errors: BridgeValidationErrors;
    warnings: BridgeValidationWarnings;
    isLoading: boolean;
    status: TransactionStatus | null;
  }>({
    errors: {},
    warnings: {},
    isLoading: false,
    status: null,
  });

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidationKeyRef = useRef<string>("");
  const validationTriggeredRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const validateRecipient = useCallback(async () => {
    debounceTimeoutRef.current = null;

    if (!enabled || !account || !recipient) {
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setValidationState(prev => ({ ...prev, isLoading: true }));

    try {
      const mainAccount = getMainAccount(account, parentAccount);
      const bridge = getAccountBridge(account, parentAccount);

      let transaction = bridge.createTransaction(mainAccount);
      transaction = bridge.updateTransaction(transaction, { recipient });

      if (memo) {
        const memoUpdates = applyMemoToTransaction(
          transaction.family,
          memo.value,
          memo.type,
          transaction,
        );
        transaction = bridge.updateTransaction(transaction, memoUpdates);
      }

      const preparedTransaction = await bridge.prepareTransaction(mainAccount, transaction);
      if (signal.aborted) return;

      const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
      if (signal.aborted) return;

      const errors: BridgeValidationErrors = {};
      const warnings: BridgeValidationWarnings = {};

      if (status.errors.recipient) errors.recipient = status.errors.recipient;
      if (status.errors.sender) errors.sender = status.errors.sender;
      if (status.errors.transaction) errors.transaction = status.errors.transaction;

      Object.entries(status.warnings).forEach(([key, value]) => {
        if (value) warnings[key] = value;
      });

      setValidationState({
        errors,
        warnings,
        isLoading: false,
        status,
      });
    } catch (error) {
      if (signal.aborted) return;
      console.error("Bridge recipient validation failed:", error);
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
    }
  }, [account, enabled, memo, parentAccount, recipient]);

  const validationKey = `${enabled ? 1 : 0}|${account?.id ?? ""}|${parentAccount?.id ?? ""}|${recipient}|${
    memo?.type ?? ""
  }|${memo?.value ?? ""}`;

  if (validationKey !== lastValidationKeyRef.current) {
    lastValidationKeyRef.current = validationKey;
    validationTriggeredRef.current = false;
    cleanup();

    if (!enabled || !account || !recipient) {
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
    }
  }

  if (enabled && account && recipient && !validationTriggeredRef.current) {
    validationTriggeredRef.current = true;
    setValidationState(prev => ({ ...prev, isLoading: true }));
    debounceTimeoutRef.current = setTimeout(() => {
      validateRecipient().catch(() => undefined);
    }, DEBOUNCE_DELAY);
  }

  return useMemo(
    () => ({
      errors: validationState.errors,
      warnings: validationState.warnings,
      isLoading: validationState.isLoading,
      status: validationState.status,
      cleanup,
    }),
    [validationState, cleanup],
  );
}
