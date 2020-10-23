// @flow
import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
  GasLessThanEstimate,
} from "@ledgerhq/errors";
import type { Transaction } from "../types";
import type { AccountBridge, CurrencyBridge } from "../../../types";
import { getMainAccount } from "../../../account";
import { getCryptoCurrencyById } from "../../../currencies";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import { getGasLimit } from "../transaction";
import { makeAccountBridgeReceive } from "../../../bridge/mockHelpers";
import { inferDynamicRange } from "../../../range";

const receive = makeAccountBridgeReceive();

const defaultGetFees = (a, t: *) =>
  (t.gasPrice || BigNumber(0)).times(getGasLimit(t));

const createTransaction = (): Transaction => ({
  family: "ethereum",
  mode: "send",
  amount: BigNumber(0),
  recipient: "",
  gasPrice: BigNumber(10000000000),
  userGasLimit: BigNumber(21000),
  estimatedGasLimit: null,
  feeCustomUnit: getCryptoCurrencyById("ethereum").units[1],
  networkInfo: null,
  useAllAmount: false,
  subAccountId: null,
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = parentAccount
    ? BigNumber(0)
    : transaction
    ? defaultGetFees(mainAccount, transaction)
    : BigNumber(1000000000000);
  return Promise.resolve(
    BigNumber.max(0, account.balance.minus(estimatedFees))
  );
};

const getTransactionStatus = (a, t) => {
  const errors = {};
  const warnings = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find((ta) => ta.id === t.subAccountId);
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

  if (
    t.userGasLimit &&
    t.estimatedGasLimit &&
    t.userGasLimit.lt(t.estimatedGasLimit)
  ) {
    warnings.gasLimit = new GasLessThanEstimate();
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
  let res = t;
  if (!res.estimatedGasLimit) {
    res = {
      ...res,
      estimatedGasLimit: t.subAccountId
        ? BigNumber("100000")
        : BigNumber("21000"),
    };
  }
  if (!res.networkInfo) {
    res = {
      ...res,
      networkInfo: {
        family: "ethereum",
        gasPrice: inferDynamicRange(BigNumber(300000)),
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
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccounts,
};

export default { currencyBridge, accountBridge };
