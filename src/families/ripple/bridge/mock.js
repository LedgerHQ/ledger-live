// @flow
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  RecipientRequired,
  FeeTooHigh
} from "@ledgerhq/errors";
import type { Transaction } from "../types";
import type { Account, AccountBridge, CurrencyBridge } from "../../../types";
import { getCryptoCurrencyById } from "../../../data/cryptocurrencies";
import { inferDeprecatedMethods } from "../../../bridge/deprecationUtils";
import {
  scanAccountsOnDevice,
  signAndBroadcast,
  startSync,
  isInvalidRecipient
} from "../../../bridge/mockHelpers";

const defaultGetFees = (a: Account, t: *) => t.fee || BigNumber(0);

const createTransaction = (): Transaction => ({
  family: "ripple",
  amount: BigNumber(0),
  recipient: "",
  fee: BigNumber(10),
  feeCustomUnit: getCryptoCurrencyById("ethereum").units[1],
  tag: undefined,
  networkInfo: null,
  useAllAmount: false
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = (a, t) => {
  const minimalBaseAmount = 10 ** a.currency.units[0].magnitude * 20;
  const errors = {};
  const warnings = {};

  const useAllAmount = !!t.useAllAmount;

  const estimatedFees = defaultGetFees(a, t);

  const totalSpent = useAllAmount
    ? a.balance
    : BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? a.balance.minus(estimatedFees)
    : BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (totalSpent.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  } else if (
    minimalBaseAmount &&
    a.balance.minus(totalSpent).lt(minimalBaseAmount)
  ) {
    errors.amount = new NotEnoughBalance();
  } else if (
    minimalBaseAmount &&
    t.recipient.includes("new") &&
    amount.lt(minimalBaseAmount)
  ) {
    // mimic XRP base minimal for new addresses
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated(null, {
      minimalAmount: `XRP Minimum reserve`
    });
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress("");
  } else if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
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
    return {
      ...t,
      networkInfo: {
        family: "ripple",
        serverFee: BigNumber(10),
        baseReserve: BigNumber(20)
      }
    };
  }
  return t;
};

const getCapabilities = () => ({
  canSync: true,
  canSend: true
});

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  startSync,
  signAndBroadcast,
  getCapabilities,
  ...inferDeprecatedMethods({
    name: "RippleMockBridge",
    createTransaction,
    getTransactionStatus,
    prepareTransaction
  })
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccountsOnDevice
};

export default { currencyBridge, accountBridge };
