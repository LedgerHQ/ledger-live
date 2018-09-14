// @flow
import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "./types";

const startSync = (_initialAccount, _observation) =>
  Observable.create(o => {
    o.error(new Error("Not Implemented"));
    return () => {};
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
