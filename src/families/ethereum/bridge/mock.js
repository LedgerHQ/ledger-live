// @flow
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh
} from "@ledgerhq/errors";
import type { Transaction } from "../types";
import type { AccountBridge, CurrencyBridge } from "../../../types";
import { getEstimatedFees } from "../../../api/Fees"; // FIXME drop. not stable.
import {
  scanAccountsOnDevice,
  signAndBroadcast,
  startSync,
  isInvalidRecipient
} from "../../../bridge/mockHelpers";
import { getGasLimit } from "../transaction";

const defaultGetFees = (a, t: *) =>
  (t.gasPrice || BigNumber(0)).times(getGasLimit(t));

const createTransaction = (account): Transaction => ({
  family: "ethereum",
  amount: BigNumber(0),
  recipient: "",
  gasPrice: BigNumber(10000000000),
  userGasLimit: BigNumber(21000),
  estimatedGasLimit: BigNumber(21000),
  feeCustomUnit: account.currency.units[1],
  networkInfo: null,
  useAllAmount: false,
  subAccountId: null
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = (a, t) => {
  const errors = {};
  const warnings = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;

  const useAllAmount = !!t.useAllAmount;

  const estimatedFees = defaultGetFees(a, t);

  const totalSpent = useAllAmount
    ? account.balance
    : tokenAccount
    ? BigNumber(t.amount)
    : BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? tokenAccount
      ? BigNumber(t.amount)
      : account.balance.minus(estimatedFees)
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
    totalSpent
  });
};

const prepareTransaction = async (a, t) => {
  // TODO it needs to set the fee if not in t as well
  if (!t.networkInfo) {
    const { gas_price } = await getEstimatedFees(a.currency);
    return {
      ...t,
      networkInfo: {
        family: "ethereum",
        gasPrice: BigNumber(gas_price)
      }
    };
  }
  return t;
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  startSync,
  signAndBroadcast
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccountsOnDevice
};

export default { currencyBridge, accountBridge };
