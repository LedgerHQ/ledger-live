// @flow
import invariant from "invariant";
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";

import type { AccountBridge } from "./types";

import {
  SyncError,
  NoRecipient,
  FeeNotLoaded,
  NotEnoughBalance,
} from "../errors";
import {
  syncAccount,
  isValidRecipient,
  getFeesForTransaction,
} from "../libcore";

type Transaction = {
  amount: BigNumber,
  recipient: string,
  feePerByte: ?BigNumber,
};

const NOT_ENOUGH_FUNDS = 52;

function operationsDiffer(a, b) {
  if ((a && !b) || (b && !a)) return true;
  return (
    a.hash !== b.hash ||
    !a.value.isEqualTo(b.value) ||
    a.blockHeight !== b.blockHeight
  );
}

const serializeTransaction = t => {
  // FIXME there is literally no need for serializeTransaction in mobile context
  const { feePerByte } = t;
  return {
    recipient: t.recipient,
    amount: t.amount.toString(),
    feePerByte: (feePerByte && feePerByte.toString()) || "0",
  };
};

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
        console.warn(err);
        o.error(new SyncError(err.message));
      }
    })();
    return cancel;
  });

const checkValidRecipient = async (currency, recipient) => {
  if (!recipient) return Promise.reject(new NoRecipient());
  return isValidRecipient({ currency, recipient });
};

const createTransaction = () => ({
  amount: BigNumber(0),
  recipient: "",
  feePerByte: null,
});

const fetchTransactionNetworkInfo = () => Promise.resolve({});

const applyTransactionNetworkInfo = (account, transaction) => transaction;

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

const editTransactionExtra = (a, t, field, value) => {
  switch (field) {
    case "feePerByte":
      invariant(
        !value || BigNumber.isBigNumber(value),
        "editTransactionExtra(a,t,'feePerByte',value): BigNumber value expected",
      );
      return { ...t, feePerByte: value };

    default:
      return t;
  }
};

const getTransactionExtra = (a, t, field) => {
  switch (field) {
    case "feePerByte":
      return t.feePerByte;

    default:
      return undefined;
  }
};

const signAndBroadcast = (_account, _t, _deviceId) =>
  Observable.create(o => {
    o.error(new Error("Not Implemented"));
  });

const addPendingOperation = (account, optimisticOperation) => ({
  ...account,
  pendingOperations: [...account.pendingOperations, optimisticOperation],
});

const getFees = async (a, t) => {
  const isValid = await checkValidRecipient(a.currency, t.recipient);
  if (isValid !== null) return null;

  return getFeesForTransaction({
    account: a,
    transaction: serializeTransaction(t),
  });
};

const checkValidTransaction = (a, t) =>
  // $FlowFixMe
  !t.feePerByte
    ? Promise.reject(new FeeNotLoaded())
    : !t.amount
      ? Promise.resolve(null)
      : getFees(a, t)
          .then(() => null)
          .catch(e => {
            if (e.code === NOT_ENOUGH_FUNDS) {
              throw new NotEnoughBalance();
            }
            throw e;
          });

const getTotalSpent = () => Promise.reject(new Error("Not Implemented"));

const getMaxAmount = () => Promise.reject(new Error("Not Implemented"));

const bridge: AccountBridge<Transaction> = {
  startSync,
  checkValidRecipient,
  createTransaction,
  fetchTransactionNetworkInfo,
  applyTransactionNetworkInfo,
  editTransactionAmount,
  getTransactionAmount,
  editTransactionRecipient,
  getTransactionRecipient,
  editTransactionExtra,
  getTransactionExtra,
  checkValidTransaction,
  getTotalSpent,
  getMaxAmount,
  signAndBroadcast,
  addPendingOperation,
};

export default bridge;
