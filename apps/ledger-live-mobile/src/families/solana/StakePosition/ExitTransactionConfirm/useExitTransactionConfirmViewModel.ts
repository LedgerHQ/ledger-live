import { useCallback, useEffect, useRef } from "react";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type {
  SolanaStakingPosition,
  Transaction as SolanaTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import type {
  StakePositionAmount,
  StakePositionConfirmProps,
  StakePositionExitAction,
} from "@features/flow-stake-position";
import { exitTransactionPatch } from "../solanaStakePosition";
import type { StakePositionAmountFormatter } from "../useStakePositionAmountFormatter";

export type ExitTransactionConfirmProps = Readonly<{
  account: Account;
  position: SolanaStakingPosition;
  action: StakePositionExitAction;
  ticker: string;
  amount: StakePositionAmount;
  validatorName: string;
  formatAmount: StakePositionAmountFormatter;
  /** Once handed off, the transaction no longer follows the account. */
  isFrozen: boolean;
  onHandOff: (transaction: SolanaTransaction, status: TransactionStatus) => void;
}>;

export type ExitTransactionConfirmViewModel = Omit<StakePositionConfirmProps, "errorContent"> &
  Readonly<{ error: Error | undefined }>;

const buildExitTransaction = (
  bridge: AccountBridge<SolanaTransaction>,
  account: Account,
  position: SolanaStakingPosition,
  action: StakePositionExitAction,
) =>
  bridge.updateTransaction(
    bridge.createTransaction(account),
    exitTransactionPatch(position, action),
  );

export function useExitTransactionConfirmViewModel({
  account,
  position,
  action,
  ticker,
  amount,
  validatorName,
  formatAmount,
  isFrozen,
  onHandOff,
}: ExitTransactionConfirmProps): ExitTransactionConfirmViewModel {
  const bridge = useAccountBridge<SolanaTransaction>(account);
  const { transaction, setTransaction, updateAccount, status, bridgePending, bridgeError } =
    useBridgeTransaction<SolanaTransaction>(bridge, () => ({
      account,
      parentAccount: null,
      transaction: buildExitTransaction(bridge, account, position, action),
    }));

  // The bridge transaction only reads its initializer on mount: until the hand-off, an account
  // update rebuilds the transaction and its status from the new data.
  const preparedAccount = useRef(account);
  useEffect(() => {
    if (isFrozen || preparedAccount.current === account) return;
    preparedAccount.current = account;
    updateAccount(account);
    setTransaction(buildExitTransaction(bridge, account, position, action));
  }, [isFrozen, account, position, action, bridge, updateAccount, setTransaction]);

  const error = bridgeError ?? Object.values(status.errors)[0];
  const isReady = Boolean(transaction) && !bridgePending;

  const onConfirm = useCallback(() => {
    if (transaction && isReady && !error) onHandOff(transaction, status);
  }, [transaction, isReady, error, onHandOff, status]);

  return {
    ticker,
    action,
    amount,
    validatorName,
    fees: isReady ? formatAmount(status.estimatedFees).crypto : undefined,
    error,
    isPending: bridgePending,
    isConfirmDisabled: !transaction || error !== undefined,
    onConfirm,
    testID: "solana-stake-position-confirm",
  };
}
