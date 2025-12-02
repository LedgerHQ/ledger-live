import { useState, useMemo, useCallback, useRef } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { BridgeValidationErrors, BridgeValidationWarnings } from "../types";

export type BridgeRecipientValidationResult = {
  errors: BridgeValidationErrors;
  warnings: BridgeValidationWarnings;
  isLoading: boolean;
  status: TransactionStatus | null;
};

type UseBridgeRecipientValidationProps = {
  recipient: string;
  account: AccountLike | null;
  parentAccount?: Account | null;
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

  const validateRecipient = useCallback(async () => {
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

      // Create a transaction with the recipient to validate
      let transaction = bridge.createTransaction(mainAccount);
      transaction = bridge.updateTransaction(transaction, { recipient });

      // Prepare the transaction (resolves ENS, validates format, etc.)
      const preparedTransaction = await bridge.prepareTransaction(mainAccount, transaction);

      if (signal.aborted) return;

      // Get the transaction status which contains errors and warnings
      const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);

      if (signal.aborted) return;

      // Extract recipient and sender specific errors/warnings
      const errors: BridgeValidationErrors = {};
      const warnings: BridgeValidationWarnings = {};

      if (status.errors.recipient) {
        errors.recipient = status.errors.recipient;
      }
      if (status.errors.sender) {
        errors.sender = status.errors.sender;
      }

      // Copy all warnings (there can be family-specific warnings)
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

      // On error, we don't block the user but log the issue
      console.error("Bridge recipient validation failed:", error);
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
    }
  }, [account, parentAccount, recipient, enabled]);

  // Track recipient changes and trigger validation
  if (recipient !== lastRecipientRef.current) {
    lastRecipientRef.current = recipient;
    validationTriggeredRef.current = false;

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Reset state immediately when recipient is cleared
    if (!recipient) {
      setValidationState({
        errors: {},
        warnings: {},
        isLoading: false,
        status: null,
      });
    }
  }

  // Debounced validation trigger
  if (recipient && !validationTriggeredRef.current && enabled) {
    validationTriggeredRef.current = true;

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set loading state immediately for better UX
    setValidationState(prev => ({ ...prev, isLoading: true }));

    // Debounce the actual validation
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
    }),
    [validationState],
  );
}
