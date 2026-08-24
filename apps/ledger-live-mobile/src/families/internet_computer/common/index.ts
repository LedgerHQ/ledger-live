import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { reassignOperationType } from "@ledgerhq/live-common/families/internet_computer/utils";
import {
  NeuronsData,
  type ICPAccount,
  type InternetComputerOperation,
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
 */
export const applyNeuronOperation = (
  dispatch: AppDispatch,
  account: ICPAccount,
  operation: InternetComputerOperation,
) => {
  dispatch(
    updateAccountWithUpdater({
      accountId: account.id,
      updater: (current: Account): Account => {
        const next = (
          operation.type !== "NONE" ? addPendingOperation(current, operation) : current
        ) as ICPAccount;
        const snapshot = operation.extra.neurons;
        if (!snapshot) return next;
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
