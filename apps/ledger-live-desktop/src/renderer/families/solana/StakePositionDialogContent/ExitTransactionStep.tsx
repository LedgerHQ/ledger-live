import React, { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { requireStakePositionId } from "@ledgerhq/live-common/families/solana/logic";
import {
  undelegateTransaction,
  withdrawTransaction,
} from "@ledgerhq/live-common/families/solana/transactions";
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
  StakePositionConfirm,
  useMarkStakePositionTransacted,
  type StakePositionExitAction,
} from "@features/flow-stake-position";
import {
  StakePositionProcessing,
  StakePositionSignature,
} from "LLD/features/StakePosition/signature";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { broadcastLogger } from "~/datadog/logs";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import TranslatedError from "~/renderer/components/TranslatedError";
import logger from "~/renderer/logger";
import { mevProtectionSelector } from "~/renderer/reducers/settings";

/** Where the exit stands: confirmed by the user, then signed on the device, then broadcast. */
export type ExitTransactionStage = "confirm" | "signing" | "broadcasting";

export type ExitTransactionStepProps = Readonly<{
  requestId: number;
  bridge: ResolvedAccountBridge<Transaction>;
  /** Read once, when the step mounts: remount it to prepare the exit of a newer position. */
  account: SolanaAccount;
  position: SolanaStakingPosition;
  action: StakePositionExitAction;
  stage: ExitTransactionStage;
  ticker: string;
  /** The chain figure the confirmation names, from the same position as the transaction. */
  amount: string;
  validatorName: string;
  accountName: string | undefined;
  onConfirm: () => void;
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
  const stakeAccount = requireStakePositionId(position);
  const exit =
    action === "deactivate"
      ? undelegateTransaction(stakeAccount)
      : withdrawTransaction(stakeAccount, position.withdrawableAmount ?? new BigNumber(0));
  return bridge.updateTransaction(bridge.createTransaction(account), exit);
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

/** Prepares the exit transaction of the position, then signs it on the device and broadcasts it. */
export function ExitTransactionStep({
  requestId,
  bridge,
  account,
  position,
  action,
  stage,
  ticker,
  amount,
  validatorName,
  accountName,
  onConfirm,
  onCancel,
  onSigned,
  onBroadcasted,
  onFailed,
}: ExitTransactionStepProps) {
  const dispatch = useDispatch();
  const mevProtected = useSelector(mevProtectionSelector);
  const markTransacted = useMarkStakePositionTransacted();
  const { transaction, status, bridgeError, bridgePending } = useBridgeTransaction<Transaction>(
    bridge,
    () => ({
      account,
      parentAccount: undefined,
      transaction: buildExitTransaction(bridge, account, position, action),
    }),
  );
  const broadcastConfig = useMemo(
    () => ({
      mevProtected,
      source: {
        type: "coin-module" as const,
        name: "ledger-live-desktop",
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
        updateAccountWithUpdater(accountId, current => addPendingOperation(current, operation)),
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
    (error: Error) => {
      if (error.name !== "UserRefusedOnDevice") logger.critical(error);
      onFailed(error);
    },
    [onFailed],
  );

  const handleSigned = useCallback(
    (signedOperation: SignedOperation) => {
      commitStakePosition(requestId);
      onSigned();
      broadcast(signedOperation).then(handleBroadcasted, (error: unknown) =>
        handleFailed(toError(error)),
      );
    },
    [broadcast, handleBroadcasted, handleFailed, onSigned, requestId],
  );

  if (stage === "broadcasting") {
    return (
      <DialogBody>
        <SyncSkipUnderPriority priority={100} />
        <StakePositionProcessing testID="stake-position-broadcasting" />
      </DialogBody>
    );
  }

  const isSigning = stage === "signing";
  const error: Error | undefined = bridgeError ?? Object.values(status.errors)[0];
  return (
    <>
      <StakePositionConfirm
        ticker={ticker}
        action={action}
        amount={amount}
        validatorName={validatorName}
        accountName={accountName}
        errorContent={error ? <TranslatedError error={error} /> : undefined}
        isPending={bridgePending || isSigning}
        isConfirmDisabled={!transaction || error !== undefined}
        onConfirm={onConfirm}
        testID="stake-position-confirm"
      />
      {isSigning && transaction ? (
        <>
          <SyncSkipUnderPriority priority={100} />
          <StakePositionSignature
            account={account}
            transaction={transaction}
            status={status}
            onSigned={handleSigned}
            onFailed={handleFailed}
            onCancel={onCancel}
          />
        </>
      ) : null}
    </>
  );
}
