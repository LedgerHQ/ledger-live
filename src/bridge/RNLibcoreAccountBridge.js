// @flow
import invariant from "invariant";
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/live-common/lib/errors";

import type { AccountBridge } from "./types";

import { SyncError, NoRecipient } from "../errors";
import {
  syncAccount,
  isValidRecipient,
  getFeesForTransaction,
} from "../libcore";
import { getFeeItems } from "../api/FeesBitcoin";
import type { FeeItems } from "../api/FeesBitcoin";

export type Transaction = {
  amount: BigNumber,
  recipient: string,
  feePerByte: ?BigNumber,
  networkInfo: ?{ feeItems: FeeItems },
};

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
  feePerByte: undefined,
  networkInfo: null,
});

const fetchTransactionNetworkInfo = async ({ currency }) => {
  const feeItems = await getFeeItems(currency);
  return { feeItems };
};

const getTransactionNetworkInfo = (account, transaction) =>
  transaction.networkInfo;

const applyTransactionNetworkInfo = (account, transaction, networkInfo) => ({
  ...transaction,
  networkInfo,
  feePerByte: transaction.feePerByte || networkInfo.feeItems.defaultFeePerByte,
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

const checkValidTransaction = async (a, t) =>
  // $FlowFixMe
  !t.feePerByte
    ? Promise.reject(new FeeNotLoaded())
    : !t.amount
      ? Promise.resolve(null)
      : getFees(a, t).then(() => null);

const getTotalSpent = async (a, t) =>
  t.amount.isZero()
    ? Promise.resolve(BigNumber(0))
    : getFees(a, t)
        .then(totalFees => t.amount.plus(totalFees || 0))
        .catch(() => BigNumber(0));

const getMaxAmount = async (a, t) =>
  getFees(a, t)
    .catch(() => BigNumber(0))
    .then(totalFees => a.balance.minus(totalFees || 0));

const bridge: AccountBridge<Transaction> = {
  startSync,
  checkValidRecipient,
  createTransaction,
  fetchTransactionNetworkInfo,
  getTransactionNetworkInfo,
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
