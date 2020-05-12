// @flow
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
} from "@ledgerhq/errors";
import type { Transaction } from "../types";
import type { AccountBridge, CurrencyBridge } from "../../../types";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import {
  setCosmosPreloadData,
  asSafeCosmosPreloadData,
} from "../preloadedData";
import { getMainAccount } from "../../../account";
import mockPreloadedData from "../preloadedData.mock";

const defaultGetFees = (a, t) =>
  (t.fees || BigNumber(0)).times(t.gasLimit || BigNumber(0));

const createTransaction = (): Transaction => ({
  family: "cosmos",
  mode: "send",
  amount: BigNumber(0),
  recipient: "",
  fees: null,
  gasLimit: null,
  memo: null,
  validators: null,
  cosmosSourceValidator: null,
  networkInfo: null,
  useAllAmount: false,
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : BigNumber(5000);
  return Promise.resolve(
    BigNumber.max(0, account.balance.minus(estimatedFees))
  );
};

const getTransactionStatus = (account, t) => {
  const errors = {};
  const warnings = {};
  const useAllAmount = !!t.useAllAmount;

  const estimatedFees = defaultGetFees(account, t);

  const totalSpent = useAllAmount
    ? account.balance
    : BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? account.balance.minus(estimatedFees)
    : BigNumber(t.amount);

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
  if (!t.networkInfo) {
    return {
      ...t,
      gasLimit: BigNumber(1),
      fees: BigNumber(500),
      networkInfo: {
        family: "cosmos",
        fees: BigNumber(500),
      },
    };
  }
  return t;
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  signOperation,
  broadcast,
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => {
    setCosmosPreloadData(mockPreloadedData);
    return Promise.resolve(mockPreloadedData);
  },
  hydrate: (data: mixed) => {
    setCosmosPreloadData(asSafeCosmosPreloadData(data));
  },
};

export default { currencyBridge, accountBridge };
