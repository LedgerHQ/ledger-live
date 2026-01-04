import { useCallback, useMemo, useRef } from "react";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import {
  useSendFlowActions,
  useSendFlowData,
  useSendFlowNavigation,
} from "../../context/SendFlowContext";

export function useSignatureViewModel() {
  const { navigation } = useSendFlowNavigation();
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();

  const hasFinishedRef = useRef(false);

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;
  const currency = state.account.currency;

  const action = useTransactionAction();
  const broadcast = useBroadcast({ account, parentAccount });

  const request = useMemo(() => {
    const tokenCurrency =
      (account && account.type === "TokenAccount" && account.token) || undefined;

    return {
      tokenCurrency,
      parentAccount,
      account,
      transaction,
      status: txStatus,
    };
  }, [account, parentAccount, transaction, txStatus]);

  const finishWithError = useCallback(
    (error: Error) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      operation.onTransactionError(error);

      const shouldResetStatus =
        currency == null || sendFeatures.isUserRefusedTransactionError(currency, error);

      if (shouldResetStatus) {
        status.resetStatus();
      } else {
        status.setError();
      }

      navigation.goToNextStep();
    },
    [navigation, operation, status, currency],
  );

  const finishWithSuccess = useCallback(
    (op: Operation) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      operation.onOperationBroadcasted(op);
      status.setSuccess();
      navigation.goToNextStep();
    },
    [navigation, operation, status],
  );

  const onDeviceActionResult = useCallback(
    (
      result:
        | { signedOperation: SignedOperation | undefined | null; device: unknown }
        | { transactionSignError: Error },
    ) => {
      if ("transactionSignError" in result) {
        finishWithError(result.transactionSignError);
        return;
      }

      const signedOperation = result.signedOperation;
      if (!signedOperation) {
        finishWithError(new Error("Missing signed operation"));
        return;
      }

      operation.onSigned();
      broadcast(signedOperation).then(finishWithSuccess, finishWithError);
    },
    [broadcast, finishWithError, finishWithSuccess, operation],
  );

  return {
    account,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
  };
}
