import React, { useCallback } from "react";
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
import type { Operation, ResolvedAccountBridge } from "@ledgerhq/types-live";
import {
  commitStakePosition,
  settleStakePosition,
  StakePositionConfirm,
  type StakePositionAmount,
  type StakePositionExitAction,
} from "@features/flow-stake-position";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import TranslatedError from "~/renderer/components/TranslatedError";
import logger from "~/renderer/logger";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";

export type ExitTransactionStepProps = Readonly<{
  requestId: number;
  bridge: ResolvedAccountBridge<Transaction>;
  /** Read once, when the step mounts: remount it to prepare the exit of a newer position. */
  account: SolanaAccount;
  position: SolanaStakingPosition;
  action: StakePositionExitAction;
  isOnDevice: boolean;
  ticker: string;
  amount: StakePositionAmount;
  validatorName: string;
  formatFees: (fees: BigNumber) => string;
  onConfirm: () => void;
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

const ignoreStepperTransition = () => undefined;

/** Prepares the exit transaction of the position, then signs and broadcasts it on the device. */
export function ExitTransactionStep({
  requestId,
  bridge,
  account,
  position,
  action,
  isOnDevice,
  ticker,
  amount,
  validatorName,
  formatFees,
  onConfirm,
  onSigned,
  onBroadcasted,
  onFailed,
}: ExitTransactionStepProps) {
  const dispatch = useDispatch();
  const {
    transaction,
    account: transactionAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(bridge, () => ({
    account,
    parentAccount: undefined,
    transaction: buildExitTransaction(bridge, account, position, action),
  }));

  const handleSigned = useCallback(
    (signed: boolean) => {
      if (!signed) return;
      commitStakePosition(requestId);
      onSigned();
    },
    [onSigned, requestId],
  );

  const accountId = account.id;
  const handleBroadcasted = useCallback(
    (operation: Operation) => {
      dispatch(
        updateAccountWithUpdater(accountId, current => addPendingOperation(current, operation)),
      );
      settleStakePosition(requestId, action);
      onBroadcasted(operation);
    },
    [accountId, action, dispatch, onBroadcasted, requestId],
  );

  const handleFailed = useCallback(
    (error: Error) => {
      if (error.name !== "UserRefusedOnDevice") logger.critical(error);
      onFailed(error);
    },
    [onFailed],
  );

  if (isOnDevice) {
    return (
      <DialogBody>
        <SyncSkipUnderPriority priority={100} />
        <GenericStepConnectDevice
          account={transactionAccount}
          transaction={transaction}
          status={status}
          transitionTo={ignoreStepperTransition}
          setSigned={handleSigned}
          onOperationBroadcasted={handleBroadcasted}
          onTransactionError={handleFailed}
        />
      </DialogBody>
    );
  }

  const error: Error | undefined = bridgeError ?? Object.values(status.errors)[0];
  return (
    <StakePositionConfirm
      ticker={ticker}
      action={action}
      amount={amount}
      validatorName={validatorName}
      fees={
        !bridgePending && status.estimatedFees.gt(0) ? formatFees(status.estimatedFees) : undefined
      }
      errorContent={error ? <TranslatedError error={error} /> : undefined}
      isPending={bridgePending}
      isConfirmDisabled={!transaction || error !== undefined}
      onConfirm={onConfirm}
      testID="stake-position-confirm"
    />
  );
}
