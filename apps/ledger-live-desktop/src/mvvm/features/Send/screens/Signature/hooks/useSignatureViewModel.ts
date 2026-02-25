import { useCallback, useMemo, useRef } from "react";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import {
  addPendingOperation,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

export function useSignatureViewModel() {
  const { navigation } = useFlowWizard();
  const { operation, status } = useSendFlowActions();
  const { state } = useSendFlowData();
  const reduxDispatch = useDispatch();

  const hasFinishedRef = useRef(false);

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const txStatus = state.transaction.status;
  const currency = state.account.currency;

  const depsRef = useRef({
    account,
    parentAccount,
    transaction,
    txStatus,
  });
  if (
    depsRef.current.account !== account ||
    depsRef.current.parentAccount !== parentAccount ||
    depsRef.current.transaction !== transaction ||
    depsRef.current.txStatus !== txStatus
  ) {
    hasFinishedRef.current = false;
    depsRef.current = { account, parentAccount, transaction, txStatus };
  }

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

      // Add pending operation to account (like in old flow)
      if (account) {
        const mainAccount = getMainAccount(account, parentAccount);
        reduxDispatch(
          updateAccountWithUpdater(mainAccount.id, acc => addPendingOperation(acc, op)),
        );
      }

      // Add recipient address to recent addresses store (like in old flow)
      if (account && transaction?.recipient) {
        const mainAccount = getMainAccount(account, parentAccount);
        const store = getRecentAddressesStore();
        const ensName = transaction.recipientDomain?.domain;
        store.addAddress(mainAccount.currency.id, transaction.recipient, ensName);
      }

      operation.onOperationBroadcasted(op);
      status.setSuccess();
      navigation.goToNextStep();
    },
    [account, parentAccount, transaction, navigation, operation, status, reduxDispatch],
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
      broadcast(signedOperation)
        .then(finishWithSuccess)
        .catch(error => {
          try {
            const normalizedError = error instanceof Error ? error : new Error(String(error));
            finishWithError(normalizedError);
          } catch (e) {
            console.error("Unhandled error during broadcast error handling", e);
          }
        });
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
