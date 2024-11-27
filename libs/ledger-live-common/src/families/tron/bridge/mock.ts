import { BigNumber } from "bignumber.js";
import { NotEnoughBalance, RecipientRequired, InvalidAddress } from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-tron/types";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import { makeAccountBridgeReceive } from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => ({
  family: "tron",
  amount: new BigNumber(0),
  useAllAmount: false,
  mode: "send",
  duration: 3,
  recipient: "",
  networkInfo: null,
  resource: null,
  votes: [],
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const estimateMaxSpendable = ({ account }) => {
  return account.balance;
};

const getTransactionStatus = (a, t) => {
  const errors: {
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    feeTooHigh?: Error;
    gasLimit?: Error;
  } = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = BigNumber(0);
  const totalSpent = useAllAmount
    ? account.balance
    : tokenAccount
      ? new BigNumber(t.amount)
      : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount
    ? tokenAccount
      ? new BigNumber(t.amount)
      : account.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  // Fill up transaction errors...
  if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Fill up recipient errors...
  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress("");
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const prepareTransaction = async (a, t) => {
  let res = t;

  if (!res.networkInfo) {
    const freeNetUsed = 0,
      freeNetLimit = 0,
      NetUsed = 0,
      NetLimit = 0,
      EnergyUsed = 0,
      EnergyLimit = 0;
    res = {
      ...res,
      networkInfo: {
        family: "tron",
        freeNetUsed: new BigNumber(freeNetUsed),
        freeNetLimit: new BigNumber(freeNetLimit),
        netUsed: new BigNumber(NetUsed),
        netLimit: new BigNumber(NetLimit),
        energyUsed: new BigNumber(EnergyUsed),
        energyLimit: new BigNumber(EnergyLimit),
      },
    };
  }
  return res;
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

export default {
  currencyBridge,
  accountBridge,
};
