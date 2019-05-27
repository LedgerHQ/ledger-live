// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, InvalidAddress } from "@ledgerhq/errors";
import { getFeeItems } from "@ledgerhq/live-common/lib/api/FeesBitcoin";
import type { FeeItems } from "@ledgerhq/live-common/lib/api/FeesBitcoin";
import type { AccountBridge } from "@ledgerhq/live-common/lib/bridge/types";
import { syncAccount } from "@ledgerhq/live-common/lib/libcore/syncAccount";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import { getFeesForTransaction } from "@ledgerhq/live-common/lib/libcore/getFeesForTransaction";
import libcoreSignAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { makeLRUCache } from "@ledgerhq/live-common/lib/cache";

export type Transaction = {
  amount: BigNumber | string,
  recipient: string,
  feePerByte: ?(BigNumber | string),
  networkInfo: ?{ feeItems: FeeItems },
};

const asLibcoreTransaction = ({ amount, recipient, feePerByte }) => ({
  amount,
  recipient,
  feePerByte,
});

const startSync = (initialAccount, _observation) => syncAccount(initialAccount);

const checkValidRecipient = makeLRUCache(
  (account, recipient) => {
    if (!recipient)
      return Promise.reject(
        new InvalidAddress("", { currencyName: account.currency.name }),
      );
    return isValidRecipient({ currency: account.currency, recipient });
  },
  (currency, recipient) => `${currency.id}_${recipient}`,
);

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

const getTransactionAmount = (a, t) => BigNumber(t.amount);

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

const signAndBroadcast = (account, transaction, deviceId) =>
  libcoreSignAndBroadcast({
    account,
    transaction: asLibcoreTransaction(transaction),
    deviceId,
  });

const addPendingOperation = (account, optimisticOperation) => ({
  ...account,
  pendingOperations: [...account.pendingOperations, optimisticOperation],
});

const getFees = makeLRUCache(
  async (a, t) => {
    await checkValidRecipient(a, t.recipient);
    return getFeesForTransaction({
      account: a,
      transaction: asLibcoreTransaction(t),
    });
  },
  (a, t) =>
    `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${t.recipient}_${
      t.feePerByte ? t.feePerByte.toString() : ""
    }`,
);

const checkValidTransaction = async (a, t) =>
  !t.feePerByte
    ? Promise.reject(new FeeNotLoaded())
    : !t.amount
    ? Promise.resolve(null)
    : getFees(a, t).then(() => null);

const getTotalSpent = async (a, t) =>
  BigNumber(t.amount).isZero()
    ? Promise.resolve(BigNumber(0))
    : getFees(a, t).then(totalFees => BigNumber(t.amount).plus(totalFees || 0));

const getMaxAmount = async (a, t) =>
  getFees(a, t).then(totalFees => a.balance.minus(totalFees || 0));

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
