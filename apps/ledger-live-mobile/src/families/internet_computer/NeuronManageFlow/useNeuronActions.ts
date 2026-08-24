import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { NeuronState } from "@ledgerhq/live-common/families/internet_computer/types";
import type {
  ICPAccount,
  ICPNeuron,
  ICPTransactionType,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";

export type NeuronScreen =
  | ScreenName.InternetComputerNeuronSelectDevice
  | ScreenName.InternetComputerNeuronIncreaseStake
  | ScreenName.InternetComputerNeuronSetDissolveDelay
  | ScreenName.InternetComputerNeuronStakeMaturity
  | ScreenName.InternetComputerNeuronSplit
  | ScreenName.InternetComputerNeuronAddHotKey
  | ScreenName.InternetComputerNeuronFollowTopic;

type Params = {
  account: ICPAccount;
  /**
   * Optional because the caller is a component: hooks cannot be skipped, and the neuron can vanish
   * between screens when a `list_neurons` refresh drops or reorders it. The screen renders nothing
   * in that case, so these handlers are never reached — but they must still be constructible.
   */
  neuron: ICPNeuron | undefined;
  navigate: (screen: NeuronScreen, params: Record<string, unknown>) => void;
};

/**
 * The per-neuron actions offered by the details screen.
 *
 * Two kinds: governance calls, which only need a device signature and so go straight to the device
 * screens, and actions that first need input from the user, which route to their own screen and
 * continue from there. `increase_stake` is neither — it debits the ledger canister, so it needs an
 * amount, but its recipient is the neuron's own subaccount and is derived, not chosen.
 */
export function useNeuronActions({ account, neuron, navigate }: Params) {
  const bridge = useAccountBridge<Transaction>(account);
  const neuronId = neuron?.id?.toString();

  // Seeds the transaction for the chosen operation and routes to the screen that finishes it. Input
  // screens then only patch their own field, so none of them has to know how to build a transaction.
  const start = useCallback(
    (screen: NeuronScreen, type: ICPTransactionType, patch: Partial<Transaction> = {}) => {
      const transaction = bridge.createTransaction(account);
      navigate(screen, {
        accountId: account.id,
        neuronId,
        transaction: bridge.updateTransaction(transaction, { ...patch, type, neuronId }),
      });
    },
    [account, bridge, navigate, neuronId],
  );

  // Operations that need nothing from the user go straight to the device.
  const submit = useCallback(
    (type: ICPTransactionType, patch: Partial<Transaction> = {}) =>
      start(ScreenName.InternetComputerNeuronSelectDevice, type, patch),
    [start],
  );

  const goTo = useCallback(
    (screen: NeuronScreen, type: ICPTransactionType) => () => start(screen, type),
    [start],
  );

  return useMemo(
    () => ({
      onIncreaseStake: goTo(ScreenName.InternetComputerNeuronIncreaseStake, "increase_stake"),
      onDisburse: () => submit("disburse"),
      onSpawnNeuron: () => submit("spawn_neuron"),
      onConfirmFollowing: () => submit("refresh_voting_power"),
      // The canister has no toggle: which call ends the dissolve depends on the current state.
      onStartStopDissolving: () =>
        submit(neuron?.state === NeuronState.Dissolving ? "stop_dissolving" : "start_dissolving"),
      onAutoStakeMaturity: (autoStakeMaturity: boolean) =>
        submit("auto_stake_maturity", { autoStakeMaturity }),
      onRemoveHotKey: (hotKeyToRemove: string) => submit("remove_hot_key", { hotKeyToRemove }),
      onFollow: goTo(ScreenName.InternetComputerNeuronFollowTopic, "follow"),
      onSplitNeuron: goTo(ScreenName.InternetComputerNeuronSplit, "split_neuron"),
      onAddHotKey: goTo(ScreenName.InternetComputerNeuronAddHotKey, "add_hot_key"),
      onStakeMaturity: goTo(ScreenName.InternetComputerNeuronStakeMaturity, "stake_maturity"),
      // A dissolved neuron sets its delay from zero; a locked one may only increase it.
      onSetDissolveDelay: goTo(
        ScreenName.InternetComputerNeuronSetDissolveDelay,
        neuron?.state === NeuronState.Dissolved ? "set_dissolve_delay" : "increase_dissolve_delay",
      ),
    }),
    [goTo, neuron?.state, submit],
  );
}
