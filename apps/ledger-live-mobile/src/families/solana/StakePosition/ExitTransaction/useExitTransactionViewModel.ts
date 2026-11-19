import { useCallback, useEffect, useMemo, useState } from "react";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { requireStakePositionId } from "@ledgerhq/live-common/families/solana/logic";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import type { Operation, ResolvedAccountBridge, SignedOperation } from "@ledgerhq/types-live";
import {
  commitStakePosition,
  settleStakePosition,
  useMarkStakePositionTransacted,
  type StakePositionExitAction,
} from "@features/flow-stake-position";
import type { StakePositionSignatureProps } from "LLM/features/StakePosition/signature";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { useDispatch, useSelector } from "~/context/hooks";
import { broadcastLogger } from "~/datadog";
import logger from "~/logger";
import { mevProtectionSelector } from "~/reducers/settings";
import { exitTransactionPatch } from "../solanaStakePosition";

/** Where the exit stands: confirmed by the user, signed on the device, broadcast, then over. */
export type ExitTransactionStage = "confirm" | "signing" | "broadcasting" | "ended";

/** What the confirmation shows of the prepared transaction. */
export type PreparedExit = Readonly<{
  transactionKey: string;
  isPending: boolean;
  isReady: boolean;
  error: Error | undefined;
}>;

export type ExitTransactionProps = Readonly<{
  requestId: number;
  /** The exit it prepares: remount it with another key to prepare a newer one. */
  transactionKey: string;
  /** Read once, when it mounts. */
  account: SolanaAccount;
  position: SolanaStakingPosition;
  action: StakePositionExitAction;
  stage: ExitTransactionStage;
  onPreparedChange: (prepared: PreparedExit) => void;
  /** The user left the device step before the transaction was signed. */
  onCancel: () => void;
  onSigned: () => void;
  onBroadcasted: (operation: Operation) => void;
  onFailed: (error: Error) => void;
}>;

function buildExitTransaction(
  bridge: ResolvedAccountBridge<Transaction>,
  account: SolanaAccount,
  position: SolanaStakingPosition,
  action: StakePositionExitAction,
): Transaction {
  return bridge.updateTransaction(
    bridge.createTransaction(account),
    exitTransactionPatch(position, action),
  );
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

/**
 * Prepares the exit transaction of the position, then signs it on the device and broadcasts it.
 * It lives next to the stake position sheet, not in it: that sheet closes while the device step
 * shows, and its content goes with it.
 */
export function useExitTransactionViewModel({
  requestId,
  transactionKey,
  account,
  position,
  action,
  stage,
  onPreparedChange,
  onCancel,
  onSigned,
  onBroadcasted,
  onFailed,
}: ExitTransactionProps) {
  const dispatch = useDispatch();
  const mevProtected = useSelector(mevProtectionSelector);
  const markTransacted = useMarkStakePositionTransacted();
  const bridge = useAccountBridge<Transaction>(account);
  const { transaction, status, bridgeError, bridgePending } = useBridgeTransaction<Transaction>(
    bridge,
    () => ({
      account,
      parentAccount: undefined,
      transaction: buildExitTransaction(bridge, account, position, action),
    }),
  );
  const error: Error | undefined = bridgeError ?? Object.values(status.errors)[0];
  const isReady = Boolean(transaction) && !bridgePending;

  useEffect(() => {
    onPreparedChange({ transactionKey, isPending: bridgePending, isReady, error });
  }, [bridgePending, error, isReady, onPreparedChange, transactionKey]);

  const broadcastConfig = useMemo(
    () => ({
      mevProtected,
      source: {
        type: "coin-module" as const,
        name: "ledger-live-mobile",
        flags: { newSendFlow: false },
      },
    }),
    [mevProtected],
  );
  const broadcast = useBroadcast({
    account,
    parentAccount: undefined,
    transaction,
    broadcastConfig,
    logger: broadcastLogger,
  });

  const accountId = account.id;
  const ownerAddress = account.freshAddress;
  const positionId = requireStakePositionId(position);
  const handleBroadcasted = useCallback(
    (operation: Operation) => {
      dispatch(
        updateAccountWithUpdater({
          accountId,
          updater: current => addPendingOperation(current, operation),
        }),
      );
      markTransacted({ ownerAddress, positionId, action });
      settleStakePosition(requestId, action);
      onBroadcasted(operation);
    },
    [
      accountId,
      action,
      dispatch,
      markTransacted,
      onBroadcasted,
      ownerAddress,
      positionId,
      requestId,
    ],
  );

  const handleFailed = useCallback(
    (failure: Error) => {
      if (failure.name !== "UserRefusedOnDevice") logger.critical(failure);
      onFailed(failure);
    },
    [onFailed],
  );

  const handleSigned = useCallback(
    (signedOperation: SignedOperation) => {
      commitStakePosition(requestId);
      onSigned();
      broadcast(signedOperation).then(handleBroadcasted, (error_: unknown) =>
        handleFailed(toError(error_)),
      );
    },
    [broadcast, handleBroadcasted, handleFailed, onSigned, requestId],
  );

  // The device step stays on screen while the network takes the signed transaction, and stays
  // mounted while its sheet animates out.
  const isSignatureRequested = stage === "signing" || stage === "broadcasting";
  const [isSignatureShown, setIsSignatureShown] = useState(isSignatureRequested);
  if (isSignatureRequested && !isSignatureShown) setIsSignatureShown(true);
  const onSignatureDismissed = useCallback(() => {
    if (!isSignatureRequested) setIsSignatureShown(false);
  }, [isSignatureRequested]);

  const signature: StakePositionSignatureProps | null =
    isSignatureShown && transaction
      ? {
          account,
          transaction,
          status,
          isOpen: isSignatureRequested,
          onSigned: handleSigned,
          onFailed: handleFailed,
          onCancel,
          onDismissed: onSignatureDismissed,
        }
      : null;

  return { isSyncSkipped: isSignatureRequested, signature };
}
