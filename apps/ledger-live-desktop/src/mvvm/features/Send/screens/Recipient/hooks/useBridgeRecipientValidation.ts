import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { applyMemoToTransaction } from "@ledgerhq/live-common/bridge/descriptor";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Memo } from "../../../types";
import type { BridgeValidationErrors, BridgeValidationWarnings } from "../types";

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

  const lastRecipientRef = useRef<string>("");
  const validationTriggeredRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function to clear timeout and abort pending validations
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
    // Clear timeout reference when callback executes
    debounceTimeoutRef.current = null;

    if (!account || !recipient || !enabled) {
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
      return;
    }

    // Cancel any pending validation
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

      if (status.errors.recipient) {
        errors.recipient = status.errors.recipient;
      }
      if (status.errors.sender) {
        errors.sender = status.errors.sender;
      }

      Object.entries(status.warnings).forEach(([key, value]) => {
        if (value) {
          warnings[key] = value;
        }
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
  }, [account, recipient, enabled, parentAccount, memo]);

  if (recipient !== lastRecipientRef.current) {
    lastRecipientRef.current = recipient;
    validationTriggeredRef.current = false;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (!recipient) {
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
    }
  }

  if (recipient && !validationTriggeredRef.current && enabled) {
    validationTriggeredRef.current = true;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setValidationState(prev => ({ ...prev, isLoading: true }));

    debounceTimeoutRef.current = setTimeout(() => {
      validateRecipient();
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
