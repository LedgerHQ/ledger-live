import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
} from "@ledgerhq/errors";
import type { AlgorandTransaction, Transaction } from "../types";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
} from "@ledgerhq/types-live";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import { getMainAccount } from "../../../account";
import { makeAccountBridgeReceive } from "../../../bridge/mockHelpers";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { initAccount } from "../initAccount";

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

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : new BigNumber(5000);
  return Promise.resolve(
    BigNumber.max(0, account.balance.minus(estimatedFees))
  );
};

const getTransactionStatus = (account: Account, t: Transaction) => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = defaultGetFees(account, t);
  const totalSpent = useAllAmount
    ? account.balance
    : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount
    ? account.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

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
  if (!t.fees) {
    return { ...t, fees: new BigNumber(500) };
  }

  return t;
};

const accountBridge: AccountBridge<AlgorandTransaction> = {
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
