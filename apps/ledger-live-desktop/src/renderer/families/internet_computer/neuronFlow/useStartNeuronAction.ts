import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type {
  ICPTransactionType,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useCallback } from "react";
import type { StepId, StepProps } from "./types";

type Params = Pick<
  StepProps,
  "account" | "onChangeTransaction" | "transitionTo" | "setLastAction" | "resetAttempt"
>;

/**
 * Starts one neuron action: discards the previous attempt, seeds a transaction for the command and
 * moves to the step that finishes it.
 *
 * Every entry point goes through here because the discard is the part that gets left out. The modal
 * stays open across actions, so an attempt kept from the last one shows its outcome beside the new
 * one — and each of the three call sites that used to spell this sequence out itself had to remember
 * that on its own. One of them didn't.
 */
export function useStartNeuronAction({
  account,
  onChangeTransaction,
  transitionTo,
  setLastAction,
  resetAttempt,
}: Params) {
  const bridge = useAccountBridge<Transaction>(account);

  return useCallback(
    (step: StepId, type: ICPTransactionType, patch: Partial<Transaction> = {}) => {
      resetAttempt();
      const transaction = bridge.createTransaction(account);
      onChangeTransaction(bridge.updateTransaction(transaction, { ...patch, type }));
      setLastAction(type);
      transitionTo(step);
    },
    [account, bridge, onChangeTransaction, resetAttempt, setLastAction, transitionTo],
  );
}
