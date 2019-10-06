// @flow
import type { Account } from "../types";

type Transaction = any;

export const inferDeprecatedMethods = ({
  name,
  getTransactionStatus,
  createTransaction,
  prepareTransaction,
  fillUpExtraFieldToApplyTransactionNetworkInfo
}: {
  name: string,
  createTransaction: Account => Transaction,
  getTransactionStatus: (Account, Transaction) => Promise<*>,
  prepareTransaction: (Account, Transaction) => Promise<*>,
  fillUpExtraFieldToApplyTransactionNetworkInfo?: (
    Account,
    Transaction,
    any
  ) => Object
}) => {
  const logged = {};
  const warn = (method, alt) => {
    if (logged[method]) return;
    logged[method] = true;
    console.warn(`${name}: ${method} is deprecated! ${alt}`);
  };

  const getTotalSpent = (a: Account, t: Transaction) => {
    warn(
      "bridge.getTotalSpent",
      "{totalSpent} =await getTransactionStatus(a, t)"
    );
    return getTransactionStatus(a, t).then(r => r.totalSpent);
  };

  const getMaxAmount = (a: Account, t: Transaction) => {
    warn(
      "bridge.getMaxAmount",
      "{amount} =await getTransactionStatus(a, t) with t.useAllAmount=true"
    );
    return getTransactionStatus(a, { ...t, useAllAmount: true }).then(
      r => r.amount
    );
  };

  const checkValidTransaction = async (a: Account, t: Transaction) => {
    warn(
      "bridge.checkValidTransaction",
      "{transactionError} =await getTransactionStatus(a, t)"
    );
    const { errors } = await getTransactionStatus(a, t);
    if (errors) throw errors[0]; // FIXME perhaps not best to throw first
    return null;
  };

  const checkValidRecipient = (a: Account, recipient: string) => {
    warn(
      "bridge.checkValidRecipient",
      "{recipientError,recipientWarning} =await getTransactionStatus(a, t)"
    );
    return getTransactionStatus(a, { ...createTransaction(a), recipient }).then(
      r => {
        if (r.errors) {
          const recipientError = r.errors.find(e => e.field === "recipient");
          if (recipientError) throw recipientError;

          const recipientWarning = r.errors.find(e => e.field === "recipient");
          if (recipientWarning) throw recipientWarning;
        }
        return null;
      }
    );
  };

  const fetchTransactionNetworkInfo = async (a: Account) => {
    warn(
      "bridge.fetchTransactionNetworkInfo",
      "use prepareTransaction instead"
    );
    const { networkInfo } = await prepareTransaction(a, createTransaction(a));
    return networkInfo;
  };

  const applyTransactionNetworkInfo = (
    account: Account,
    transaction: Transaction,
    networkInfo: any
  ) => {
    warn(
      "bridge.applyTransactionNetworkInfo",
      "use prepareTransaction instead"
    );
    return {
      ...transaction,
      networkInfo,
      ...(fillUpExtraFieldToApplyTransactionNetworkInfo &&
        fillUpExtraFieldToApplyTransactionNetworkInfo(
          account,
          transaction,
          networkInfo
        ))
    };
  };

  const getTransactionNetworkInfo = (
    account: Account,
    transaction: Transaction
  ) => {
    warn("bridge.getTransactionNetworkInfo", "remove this usage.");
    return transaction.networkInfo;
  };

  const editTransactionAmount = (
    account: Account,
    t: Transaction,
    amount: any
  ) => {
    warn(
      "bridge.editTransactionAmount",
      "bridge.updateTransaction(t, { amount })"
    );
    return {
      ...t,
      amount
    };
  };

  const getTransactionAmount = (a: Account, t: Transaction) => {
    warn("bridge.getTransactionAmount", "directly access t.amount");
    return t.amount;
  };

  const editTransactionRecipient = (
    account: Account,
    t: Transaction,
    recipient: string
  ) => {
    warn(
      "bridge.editTransactionRecipient",
      "bridge.updateTransaction(t, { recipient })"
    );
    return {
      ...t,
      recipient
    };
  };

  const getTransactionRecipient = (a: Account, t: Transaction) => {
    warn("bridge.getTransactionRecipient", "directly access t.recipient");
    return t.recipient;
  };

  const editTransactionExtra = (
    a: Account,
    t: Transaction,
    field: string,
    value: any
  ) => {
    warn(
      "bridge.editTansactionExtra",
      "bridge.updateTransaction(t, { field })"
    );
    return {
      ...t,
      [field]: value
    };
  };

  const getTransactionExtra = (a: Account, t: Transaction, field: string) => {
    warn("bridge.getTransactionExtra", "directly access t.field");
    return t[field];
  };

  const editTokenAccountId = (
    a: Account,
    t: Transaction,
    subAccountId: ?string
  ) => {
    warn(
      "bridge.editTokenAccountId",
      "bridge.updateTransaction(t, { subAccountId })"
    );
    return {
      ...t,
      subAccountId
    };
  };

  const getTokenAccountId = (a: Account, t: Transaction) => {
    warn("bridge.getTokenAccountId", "directly access t.subAccountId");
    return t.subAccountId;
  };

  return {
    getTotalSpent,
    getMaxAmount,
    checkValidTransaction,
    checkValidRecipient,
    fetchTransactionNetworkInfo,
    applyTransactionNetworkInfo,
    getTransactionNetworkInfo,
    editTransactionAmount,
    getTransactionAmount,
    editTransactionRecipient,
    getTransactionRecipient,
    editTransactionExtra,
    getTransactionExtra,
    editTokenAccountId,
    getTokenAccountId
  };
};
