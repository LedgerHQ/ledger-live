import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import logger from "~/renderer/logger";
import { useSendFlowOperationState } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowOperationState";
import type {
  SendFlowOperationResult,
  SendFlowOperationActions,
} from "@ledgerhq/live-common/flows/send/types";

type UseSendFlowOperationParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
}>;

type UseSendFlowOperationResult = Readonly<{
  state: SendFlowOperationResult;
  actions: SendFlowOperationActions;
}>;

export function useSendFlowOperation({
  account,
  parentAccount,
}: UseSendFlowOperationParams): UseSendFlowOperationResult {
  const reduxDispatch = useDispatch();
  const { state, actions: stateActions } = useSendFlowOperationState();

  const onOperationBroadcasted = useCallback(
    (operation: Operation) => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);
      reduxDispatch(
        updateAccountWithUpdater(mainAccount.id, acc => addPendingOperation(acc, operation)),
      );
      stateActions.dispatchSetOperation(operation);
    },
    [account, parentAccount, reduxDispatch, stateActions],
  );

  const onTransactionError = useCallback(
    (error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }
      stateActions.dispatchSetError(error);
    },
    [stateActions],
  );

  const onSigned = useCallback(() => {
    stateActions.dispatchSetSigned();
  }, [stateActions]);

  const onRetry = useCallback(() => {
    stateActions.dispatchReset();
  }, [stateActions]);

  const actions: SendFlowOperationActions = useMemo(
    () => ({ onOperationBroadcasted, onTransactionError, onSigned, onRetry }),
    [onOperationBroadcasted, onTransactionError, onSigned, onRetry],
  );

  return { state, actions };
}
