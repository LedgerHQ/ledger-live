// @flow
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "./types";

import { syncAccount } from "../libcore";

function operationsDiffer(a, b) {
  if ((a && !b) || (b && !a)) return true;
  return (
    a.hash !== b.hash ||
    !a.value.isEqualTo(b.value) ||
    a.blockHeight !== b.blockHeight
  );
}

const startSync = (initialAccount, _observation) =>
  Observable.create(o => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    const cancel = () => (cancelled = true);

    (async () => {
      try {
        const syncedAccount = await syncAccount({
          account: initialAccount,
          cancel,
        });
        if (isCancelled()) return;

        o.next(initialAccount => {
          const patch = {
            ...initialAccount,
            id: syncedAccount.id,
            freshAddress: syncedAccount.freshAddress,
            freshAddressPath: syncedAccount.freshAddressPath,
            balance: syncedAccount.balance,
            blockHeight: syncedAccount.blockHeight,
            lastSyncDate: new Date(),
            operations: initialAccount.operations,
            pendingOperations: [],
          };

          const oldOpsLength = initialAccount.operations.length;
          const newOpsLength = syncedAccount.operations.length;

          const patchedOperations = [];
          let hasChanged = false;

          for (let i = 0; i < newOpsLength; i++) {
            const newOp = syncedAccount.operations[newOpsLength - 1 - i];
            const oldOp = initialAccount.operations[oldOpsLength - 1 - i];
            if (operationsDiffer(newOp, oldOp)) {
              hasChanged = true;
              patchedOperations.push(newOp);
            } else {
              patchedOperations.push(oldOp);
            }
          }

          if (hasChanged) {
            patch.operations = patchedOperations;
          }

          return patch;
        });
        o.complete();
      } catch (err) {
        console.error(err);
        o.error(err);
      }
    })();
    return cancel;
  });

const checkValidRecipient = (_currency, _recipient) =>
  Promise.reject(new Error("Not Implemented"));

const createTransaction = () => ({
  amount: BigNumber(0),
  recipient: "",
});

const editTransactionAmount = (account, t, amount) => ({
  ...t,
  amount,
});

const getTransactionAmount = (a, t) => t.amount;

const editTransactionRecipient = (account, t, recipient) => ({
  ...t,
  recipient,
});

const getTransactionRecipient = (a, t) => t.recipient;

const signAndBroadcast = (_account, _t, _deviceId) =>
  Observable.create(o => {
    o.error(new Error("Not Implemented"));
  });

const addPendingOperation = (account, optimisticOperation) => ({
  ...account,
  pendingOperations: [...account.pendingOperations, optimisticOperation],
});

const checkValidTransaction = () =>
  Promise.reject(new Error("Not Implemented"));

const getTotalSpent = () => Promise.reject(new Error("Not Implemented"));

const getMaxAmount = () => Promise.reject(new Error("Not Implemented"));

const bridge: AccountBridge<*> = {
  startSync,
  checkValidRecipient,
  createTransaction,
  editTransactionAmount,
  getTransactionAmount,
  editTransactionRecipient,
  getTransactionRecipient,
  checkValidTransaction,
  getTotalSpent,
  getMaxAmount,
  signAndBroadcast,
  addPendingOperation,
};

export default bridge;
