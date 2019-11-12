// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { scanAccountsOnDevice } from "../../../libcore/scanAccountsOnDevice";
import { validateRecipient } from "../../../bridge/shared";
import type { AccountBridge, CurrencyBridge } from "../../../types/bridge";
import type { Transaction } from "../types";
import { syncAccount } from "../../../libcore/syncAccount";
import libcoreSignAndBroadcast from "../../../libcore/signAndBroadcast";
import { getAccountNetworkInfo } from "../../../libcore/getAccountNetworkInfo";
import {
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance
} from "@ledgerhq/errors";

const startSync = (initialAccount, _observation) => syncAccount(initialAccount);

const createTransaction = () => ({
  family: "ripple",
  amount: BigNumber(0),
  recipient: "",
  tag: undefined,
  fee: null,
  feeCustomUnit: null,
  networkInfo: null
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
  const baseReserve = t.networkInfo ? t.networkInfo.baseReserve : BigNumber(0);
  const estimatedFees = t.fee || BigNumber(0);

  const totalSpent = !t.useAllAmount
    ? t.amount.plus(estimatedFees)
    : a.balance.minus(baseReserve);

  const amount = t.useAllAmount ? a.balance.minus(estimatedFees) : t.amount;

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!t.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (t.fee.eq(0)) {
    errors.fee = new FeeRequired();
    totalSpent.gt(a.balance.minus(baseReserve));
  } else if (totalSpent.gt(a.balance.minus(baseReserve))) {
    errors.amount = new NotEnoughBalance();
  }
  // TODO take care of account not created ; NotEnoughBalanceBecauseDestinationNotCreated

  if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else {
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
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

const prepareTransaction = async (a, t) => {
  let networkInfo = t.networkInfo;
  if (!networkInfo) {
    const r = await getAccountNetworkInfo(a);
    invariant(r.family === "ripple", "ripple getAccountNetworkInfo expected");
    networkInfo = r;
  }

  const fee = t.fee || networkInfo.serverFee;

  if (t.networkInfo !== networkInfo || t.fee !== fee) {
    return {
      ...t,
      networkInfo,
      fee
    };
  }

  return t;
};

const getCapabilities = () => ({
  canDelegate: false,
  canSync: true,
  canSend: true
});

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccountsOnDevice
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
