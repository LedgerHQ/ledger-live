// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import {
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  NotEnoughBalance
} from "@ledgerhq/errors";
import { validateRecipient } from "../../../bridge/shared";
import type { AccountBridge, CurrencyBridge } from "../../../types/bridge";
import type { Account } from "../../../types/account";
import type { Transaction } from "../types";
import { syncAccount } from "../../../libcore/syncAccount";
import { scanAccountsOnDevice } from "../../../libcore/scanAccountsOnDevice";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import { getFeesForTransaction } from "../../../libcore/getFeesForTransaction";
import libcoreSignAndBroadcast from "../../../libcore/signAndBroadcast";
import { makeLRUCache } from "../../../cache";

const startSync = (initialAccount, _observation) => syncAccount(initialAccount);

const calculateFees = makeLRUCache(
  async (a, t) => {
    return getFeesForTransaction({
      account: a,
      transaction: t
    });
  },
  (a, t) =>
    `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${t.recipient}_${
      t.feePerByte ? t.feePerByte.toString() : ""
    }`
);

const createTransaction = () => ({
  family: "bitcoin",
  amount: BigNumber(0),
  recipient: "",
  feePerByte: null,
  networkInfo: null,
  useAllAmount: false
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const signAndBroadcast = (account, transaction, deviceId) =>
  libcoreSignAndBroadcast({
    account,
    transaction,
    deviceId
  });

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  let { recipientError, recipientWarning } = await validateRecipient(
    a.currency,
    t.recipient
  );

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }

  let estimatedFees = BigNumber(0);
  if (!t.feePerByte) {
    errors.feePerByte = new FeeNotLoaded();
  } else if (t.feePerByte.eq(0)) {
    errors.feePerByte = new FeeRequired();
  } else if (!errors.recipient) {
    await calculateFees(a, t).then(
      _estimatedFees => {
        estimatedFees = _estimatedFees;
      },
      error => {
        if (error.name === "NotEnoughBalance") {
          errors.amount = error;
        } else {
          throw error;
        }
      }
    );
  }

  const totalSpent = useAllAmount ? a.balance : t.amount.plus(estimatedFees);
  const amount = useAllAmount ? a.balance.minus(estimatedFees) : t.amount;

  // FIXME libcore have a bug that don't detect some cases like when doing send max!
  if (!errors.amount && useAllAmount && !amount.gt(0)) {
    errors.amount = new NotEnoughBalance();
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(a);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }
  const feePerByte = t.feePerByte || networkInfo.feeItems.defaultFeePerByte;
  if (
    t.networkInfo === networkInfo &&
    (feePerByte === t.feePerByte || feePerByte.eq(t.feePerByte || 0))
    // nothing changed
  ) {
    return t;
  }
  return {
    ...t,
    networkInfo,
    feePerByte
  };
};

const getCapabilities = () => ({
  canSync: true,
  canSend: true
});

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice,
  preload: () => Promise.resolve(),
  hydrate: () => {}
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  startSync,
  signAndBroadcast,
  getCapabilities
};

export default { currencyBridge, accountBridge };
