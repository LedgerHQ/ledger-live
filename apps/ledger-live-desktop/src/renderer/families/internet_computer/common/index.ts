import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { applyNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { reassignOperationType } from "@ledgerhq/live-common/families/internet_computer/utils";
import {
  NeuronsData,
  type ICPAccount,
  type InternetComputerOperation,
  type Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Account, Operation, ResolvedAccountBridge } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { openModal } from "~/renderer/actions/modals";
import type { AppDispatch } from "~/state-manager/configureStore";

// Staking an ICP goes through the regular send flow: `create_neuron` debits the ledger canister the
// same way a transfer does. There is no validator to pick — prepareTransaction derives the neuron's
// governance subaccount as the recipient, and the nonce it stores there is also the memo. Both are
// protocol-derived, so the flow starts at the amount step with no way back into recipient entry.
// The bridge is resolved by the caller, since getAccountBridge is async and these are not hooks.
export const onClickStakeIcp = (
  dispatch: AppDispatch,
  account: ICPAccount,
  bridge: ResolvedAccountBridge<Transaction>,
) => {
  const transaction = bridge.createTransaction(account);
  dispatch(
    openModal("MODAL_SEND", {
      account,
      transaction: bridge.updateTransaction(transaction, { type: "create_neuron" }),
      stepId: "amount",
      disableBacks: ["amount"],
      onConfirmationHandler: onStakeConfirmed(dispatch, account),
    }),
  );
};

export const onClickManageNeurons = (dispatch: AppDispatch, account: ICPAccount) => {
  dispatch(openModal("MODAL_ICP_LIST_NEURONS", { account }));
};

/**
 * Apply a broadcast operation to the account, carrying any neuron snapshot it returned.
 *
 * Background sync cannot fetch neurons — that needs a device signature — so a signed `list_neurons`
 * is the only thing that refreshes them, and its result rides in `extra.neurons`. The bridge does
 * the same fold on the next sync (bridgeHelpers/account.ts); this makes it visible immediately.
 *
 * A `manage_neuron` call returns no snapshot, so `transaction` lets the command the canister just
 * accepted be replayed onto the stored neuron instead. `lastUpdatedMSecs` deliberately does not move
 * for that: the neuron is only as fresh as the last real read.
 */
export const applyNeuronOperation = (
  dispatch: AppDispatch,
  account: ICPAccount,
  operation: InternetComputerOperation,
  transaction?: Transaction,
) => {
  dispatch(
    updateAccountWithUpdater(account.id, (current: Account): Account => {
      const next = (
        operation.type !== "NONE" ? addPendingOperation(current, operation) : current
      ) as ICPAccount;
      const snapshot = operation.extra.neurons;
      if (!snapshot) {
        const outcome = operation.extra.outcome;
        const patched = transaction
          ? applyNeuronCommand(next.neurons.fullNeurons, transaction, {
              ...(outcome !== undefined && { outcome }),
            })
          : undefined;
        if (!patched) return next;
        const replayed: ICPAccount = {
          ...next,
          neurons: new NeuronsData(patched, next.neurons.lastUpdatedMSecs),
        };
        return replayed;
      }
      const updated: ICPAccount = {
        ...next,
        neurons: new NeuronsData(snapshot, operation.date.getTime()),
        // A transfer to one of the account's own neuron subaccounts is a stake or a top-up, not a
        // plain send — but that can only be known once the neuron addresses are known.
        operations: reassignOperationType(
          next.operations as InternetComputerOperation[],
          snapshot.map(neuron => neuron.accountIdentifier),
        ),
      };
      return updated;
    }),
  );
};

/**
 * Hands the user back to their neurons once a staking transfer succeeds.
 *
 * Files the operation itself: supplying `onConfirmationHandler` makes the send modal close without
 * calling its own `onOperationBroadcasted`, so nothing else would.
 *
 * Opens the list rather than the new neuron's manage screen — only a device-signed `list_neurons`
 * puts that neuron in the snapshot, and the list is where that Sync lives.
 */
export const onStakeConfirmed =
  (dispatch: AppDispatch, account: ICPAccount, knownNeuronId?: string) =>
  (operation: Operation) => {
    const icpOperation = operation as InternetComputerOperation;
    applyNeuronOperation(dispatch, account, icpOperation);
    const neuronId = knownNeuronId ?? icpOperation.extra.createdNeuronId;
    dispatch(openModal("MODAL_ICP_LIST_NEURONS", { account, ...(neuronId && { neuronId }) }));
  };
