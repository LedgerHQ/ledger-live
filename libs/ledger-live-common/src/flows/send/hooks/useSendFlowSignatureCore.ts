import { useCallback, useMemo, useRef } from "react";
import type { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getMainAccount } from "../../../account/index";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import type { Transaction, TransactionStatus } from "../../../coin-modules/transaction-types";
import { saveRecentSendRecipient } from "../utils";

export type SignatureDeviceActionResult =
  | { signedOperation: SignedOperation | undefined | null; device: unknown }
  | { transactionSignError: Error };

export type SignatureRequest = Readonly<{
  tokenCurrency?: TokenCurrency | null | undefined;
  parentAccount: Account | null | undefined;
  account: AccountLike;
  transaction: Transaction;
  status?: TransactionStatus;
}>;

export type UseSendFlowSignatureCoreParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  transaction: Transaction | null;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency | null;
  /** Broadcasts a signed operation and resolves with the optimistic operation. */
  broadcast: (signedOperation: SignedOperation) => Promise<Operation>;
  operation: Readonly<{
    onTransactionError: (error: Error) => void;
    onSigned: () => void;
    onOperationBroadcasted: (operation: Operation) => void;
  }>;
  statusActions: Readonly<{
    resetStatus: () => void;
    setError: () => void;
    setSuccess: () => void;
  }>;
  /** Advances the flow to the next step (e.g. confirmation). */
  onFinish: () => void;
  /** Persists the optimistic operation as pending on the (main) account, app-side. */
  registerPendingOperation: (mainAccount: Account, operation: Operation) => void;
  /** Optional ENS name from the flow recipient state (fallback: transaction.recipientDomain). */
  recipientEnsName?: string | null;
}>;

export type UseSendFlowSignatureCoreResult = Readonly<{
  request: SignatureRequest | null;
  finishWithError: (error: Error) => void;
  finishWithSuccess: (operation: Operation) => void;
  onDeviceActionResult: (result: SignatureDeviceActionResult) => void;
}>;

/**
 * Platform-agnostic Send flow signature logic shared by desktop and mobile.
 *
 * It builds the device-action request, handles the signature result (broadcast,
 * success/error resolution) and guarantees the flow only finishes once per set
 * of inputs. The platform layer injects the side-effects that differ across apps
 * (broadcast, redux pending-operation persistence, navigation, status actions).
 */
export function useSendFlowSignatureCore({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  broadcast,
  operation,
  statusActions,
  onFinish,
  registerPendingOperation,
  recipientEnsName,
}: UseSendFlowSignatureCoreParams): UseSendFlowSignatureCoreResult {
  const hasFinishedRef = useRef(false);
  // Monotonically-increasing id identifying the current set of signature inputs.
  // Async broadcast handlers capture it to ignore results from a superseded run.
  const runIdRef = useRef(0);

  const depsRef = useRef({ account, parentAccount, transaction, status });
  if (
    depsRef.current.account !== account ||
    depsRef.current.parentAccount !== parentAccount ||
    depsRef.current.transaction !== transaction ||
    depsRef.current.status !== status
  ) {
    hasFinishedRef.current = false;
    runIdRef.current += 1;
    depsRef.current = { account, parentAccount, transaction, status };
  }

  const request = useMemo<SignatureRequest | null>(() => {
    if (!account || !transaction) {
      return null;
    }

    const tokenCurrency =
      (account && account.type === "TokenAccount" && account.token) || undefined;

    return {
      tokenCurrency,
      parentAccount,
      account,
      transaction,
      status,
    };
  }, [account, parentAccount, transaction, status]);

  const finishWithError = useCallback(
    (error: Error) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      operation.onTransactionError(error);

      const shouldResetStatus =
        currency == null || sendFeatures.isUserRefusedTransactionError(currency, error);

      if (shouldResetStatus) {
        statusActions.resetStatus();
      } else {
        statusActions.setError();
      }

      onFinish();
    },
    [currency, operation, statusActions, onFinish],
  );

  const finishWithSuccess = useCallback(
    (op: Operation) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;

      if (account) {
        const mainAccount = getMainAccount(account, parentAccount ?? undefined);
        registerPendingOperation(mainAccount, op);

        if (transaction) {
          saveRecentSendRecipient(account, parentAccount, transaction, recipientEnsName);
        }
      }

      operation.onOperationBroadcasted(op);
      statusActions.setSuccess();
      onFinish();
    },
    [
      account,
      parentAccount,
      transaction,
      recipientEnsName,
      operation,
      statusActions,
      onFinish,
      registerPendingOperation,
    ],
  );

  const onDeviceActionResult = useCallback(
    (result: SignatureDeviceActionResult) => {
      if ("transactionSignError" in result) {
        finishWithError(result.transactionSignError);
        return;
      }

      const signedOperation = result.signedOperation;
      if (!signedOperation) {
        finishWithError(new Error("Missing signed operation"));
        return;
      }

      const runId = runIdRef.current;
      operation.onSigned();
      broadcast(signedOperation)
        .then(broadcastedOperation => {
          // Ignore results from a superseded run (inputs changed mid-broadcast).
          if (runIdRef.current !== runId) return;
          finishWithSuccess(broadcastedOperation);
        })
        .catch(error => {
          try {
            if (runIdRef.current !== runId) return;
            const normalizedError = error instanceof Error ? error : new Error(String(error));
            finishWithError(normalizedError);
          } catch (e) {
            console.error("Unhandled error during broadcast error handling", e);
          }
        });
    },
    [broadcast, finishWithError, finishWithSuccess, operation],
  );

  return { request, finishWithError, finishWithSuccess, onDeviceActionResult };
}
