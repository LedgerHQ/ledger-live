import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { NeuronState } from "@ledgerhq/live-common/families/internet_computer/types";
import type {
  ICPNeuron,
  ICPTransactionType,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "LLD/hooks/redux";
import { useCallback, useMemo } from "react";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { onStakeConfirmed } from "../common";
import { useStartNeuronAction } from "./useStartNeuronAction";
import type { StepId, StepProps } from "./types";

type Params = Pick<
  StepProps,
  "account" | "onChangeTransaction" | "transitionTo" | "setLastAction" | "resetAttempt"
> & {
  /** Absent when the selected neuron is gone: the caller still has to run the hook unconditionally. */
  neuron: ICPNeuron | undefined;
};

/**
 * The per-neuron actions offered by the manage step.
 *
 * Two kinds: governance calls, which only need a device signature and so go straight to the signing
 * step, and actions that first need input from the user, which route to their own step and submit
 * from there. `increase_stake` is neither — it debits the ledger canister, so it runs through the
 * regular send flow and hands control back here on success.
 */
export function useNeuronActions({
  account,
  neuron,
  onChangeTransaction,
  transitionTo,
  setLastAction,
  resetAttempt,
}: Params) {
  const dispatch = useDispatch();
  const bridge = useAccountBridge<Transaction>(account);
  const neuronId = neuron?.id?.toString();
  const startAction = useStartNeuronAction({
    account,
    onChangeTransaction,
    transitionTo,
    setLastAction,
    resetAttempt,
  });

  // Every action here targets the neuron on screen. Input steps then only patch their own field, so
  // none of them has to know how to build a transaction.
  const start = useCallback(
    (step: StepId, type: ICPTransactionType, patch: Partial<Transaction> = {}) =>
      startAction(step, type, { ...patch, neuronId }),
    [neuronId, startAction],
  );

  // Operations that need nothing from the user go straight to the device.
  const submit = useCallback(
    (type: ICPTransactionType, patch: Partial<Transaction> = {}) =>
      start("manageAction", type, patch),
    [start],
  );

  const goTo = useCallback(
    (step: StepId, type: ICPTransactionType) => () => start(step, type),
    [start],
  );

  const onClickIncreaseStake = useCallback(() => {
    const transaction = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        account,
        transaction: bridge.updateTransaction(transaction, { type: "increase_stake", neuronId }),
        stepId: "amount",
        // The neuron's subaccount is the recipient and prepareTransaction derives it, so there is no
        // recipient step to go back to.
        disableBacks: ["amount"],
        onConfirmationHandler: onStakeConfirmed(dispatch, account, neuronId),
      }),
    );
  }, [account, bridge, dispatch, neuronId]);

  return useMemo(
    () => ({
      onClickIncreaseStake,
      onClickDisburse: () => submit("disburse"),
      onClickSpawnNeuron: () => submit("spawn_neuron"),
      onClickConfirmFollowing: () => submit("refresh_voting_power"),
      // The canister has no toggle: which call ends the dissolve depends on the current state.
      onClickStartStopDissolving: () =>
        submit(neuron?.state === NeuronState.Dissolving ? "stop_dissolving" : "start_dissolving"),
      onClickAutoStakeMaturity: (autoStakeMaturity: boolean) =>
        submit("auto_stake_maturity", { autoStakeMaturity }),
      onClickRemoveHotKey: (hotKeyToRemove: string) => submit("remove_hot_key", { hotKeyToRemove }),
      onClickFollow: goTo("followTopic", "follow"),
      onClickSplitNeuron: goTo("splitNeuron", "split_neuron"),
      onClickAddHotKey: goTo("addHotKey", "add_hot_key"),
      onClickStakeMaturity: goTo("stakeMaturity", "stake_maturity"),
      // A dissolved neuron sets its delay from zero; a locked one may only increase it.
      onClickSetDissolveDelay: goTo(
        "setDissolveDelay",
        neuron?.state === NeuronState.Dissolved ? "set_dissolve_delay" : "increase_dissolve_delay",
      ),
    }),
    [goTo, neuron?.state, onClickIncreaseStake, submit],
  );
}
