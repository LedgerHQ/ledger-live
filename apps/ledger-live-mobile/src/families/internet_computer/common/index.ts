import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { applyNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { reassignOperationType } from "@ledgerhq/live-common/families/internet_computer/utils";
import {
  isInternetComputerOperationExtra,
  NeuronsData,
  type ICPAccount,
  type InternetComputerOperation,
  type Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Account } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/actions/accounts";
import type { AppDispatch } from "~/state-manager/configureStore";

/**
 * Apply a broadcast operation to the account, carrying any neuron snapshot it returned.
 *
 * Background sync cannot fetch neurons — that needs a device signature — so a signed `list_neurons`
 * is the only thing that refreshes them, and its result rides in `extra.neurons`. The bridge does
 * the same fold on the next sync (bridgeHelpers/account.ts); this makes it visible immediately,
 * which the shared ConnectDevice does not do (it only adds the pending operation).
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
    updateAccountWithUpdater({
      accountId: account.id,
      updater: (current: Account): Account => {
        const next = (
          operation.type !== "NONE" ? addPendingOperation(current, operation) : current
        ) as ICPAccount;
        const snapshot = operation.extra.neurons;
        if (!snapshot) {
          // `neurons` is typed as required but is only populated by a sync or a deserialize, and a
          // freshly added account stakes before it has either — every stake reaches this branch,
          // since only list_neurons carries a snapshot.
          const stored = next.neurons ?? NeuronsData.empty();
          const outcome = operation.extra.outcome;
          const patched = transaction
            ? applyNeuronCommand(stored.fullNeurons, transaction, {
                ...(outcome !== undefined && { outcome }),
              })
            : undefined;
          if (!patched) return next;
          const replayed: ICPAccount = {
            ...next,
            neurons: new NeuronsData(patched, stored.lastUpdatedMSecs),
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
      },
    }),
  );
};

/**
 * Whether a stake this session broadcast is still waiting to become a visible neuron.
 *
 * A successful `create_neuron` returns `extra.createdNeuronId`, but nothing can turn that into a
 * neuron: only a device-signed `list_neurons` fills the snapshot. So the account keeps an empty one
 * and reads as never having staked, which is how a freshly staked user is shown "Stake ICP" again.
 *
 * Pending operations only, and it expires: `addPendingOperation` writes nowhere else, and the synced
 * transfer that follows is rebuilt from the explorer carrying `extra: { memo }` alone. Confirming
 * does not end it — `shouldRetainPendingOperation` discards an ICP operation on age alone, these
 * having no `transactionSequenceNumber` — so the marker lasts OPERATION_OPTIMISTIC_RETENTION, thirty
 * minutes, from the broadcast. Long enough for the trip back to the account page, which is the point.
 */
export const hasStakeAwaitingNeurons = (account: ICPAccount): boolean =>
  (account.pendingOperations ?? []).some(operation => {
    const { extra } = operation;
    if (!isInternetComputerOperationExtra(extra)) return false;
    return extra.createdNeuronId !== undefined || extra.methodName === "create_neuron";
  });
