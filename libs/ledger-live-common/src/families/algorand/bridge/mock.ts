// TODO: update path by moving mockHelpers to coin-framework

import { BigNumber } from "bignumber.js";
import { NotEnoughBalance, RecipientRequired, InvalidAddress, FeeTooHigh } from "@ledgerhq/errors";
import type {
  AlgorandAccount,
  AlgorandTransaction,
  Transaction,
} from "@ledgerhq/coin-algorand/types";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { assignToAccountRaw, assignFromAccountRaw } from "@ledgerhq/coin-algorand/serialization";
import { initAccount } from "@ledgerhq/coin-algorand/initAccount";

const receive = makeAccountBridgeReceive();

const defaultGetFees = (a, t) => t.fees || new BigNumber(0);

const createTransaction = (): AlgorandTransaction => ({
  family: "algorand",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  fees: null,
  memo: null,
  useAllAmount: false,
  assetId: null,
});

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : new BigNumber(5000);
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account: AlgorandAccount, transaction: Transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;
  const estimatedFees = defaultGetFees(account, transaction);
  const totalSpent = useAllAmount
    ? account.balance
    : new BigNumber(transaction.amount).plus(estimatedFees);
  const amount = useAllAmount
    ? account.balance.minus(estimatedFees)
    : new BigNumber(transaction.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  // Fill up transaction errors...
  if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Fill up recipient errors...
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
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
  if (!t.fees) {
    return { ...t, fees: new BigNumber(500) };
  }

  return t;
};

const accountBridge: AccountBridge<AlgorandTransaction, any> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  assignToAccountRaw,
  assignFromAccountRaw,
  initAccount,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
};
const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => {
    return Promise.resolve({});
  },
  hydrate: () => {},
};
export default {
  currencyBridge,
  accountBridge,
};
