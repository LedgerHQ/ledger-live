import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import type { Transaction } from "../types";
import { getFeeItems } from "../../../api/FeesBitcoin";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import { getMainAccount } from "../../../account";
import { makeAccountBridgeReceive } from "../../../bridge/mockHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
const receive = makeAccountBridgeReceive();

const defaultGetFees = (a, t: any) =>
  (t.feePerByte || new BigNumber(0)).times(250);

const createTransaction = (): Transaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "",
  feePerByte: new BigNumber(10),
  networkInfo: null,
  useAllAmount: false,
  rbf: false,
  utxoStrategy: {
    strategy: 0,
    excludeUTXOs: [],
  },
});

const updateTransaction = (t, patch): any => ({ ...t, ...patch });

const estimateMaxSpendable = ({
  account,
  parentAccount,
  transaction,
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : new BigNumber(5000);
  return Promise.resolve(
    BigNumber.max(0, account.balance.minus(estimatedFees))
  );
};

const getTransactionStatus = (account, t) => {
  const errors: { [key: string]: any } = {};
  const warnings: { [key: string]: any } = {};
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = defaultGetFees(account, t);
  const totalSpent = useAllAmount
    ? account.balance
    : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount
    ? account.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount
      ? new NotEnoughBalance()
      : new AmountRequired();
  }
  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  // Fill up transaction errors...
  if (!errors.amount && totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Fill up recipient errors...
  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
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

const prepareTransaction = async (a, t): Promise<Transaction> => {
  // TODO it needs to set the fee if not in t as well
  if (!t.networkInfo) {
    const feeItems = await getFeeItems(a.currency);
    return {
      ...t,
      networkInfo: {
        family: "bitcoin",
        feeItems,
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
  receive,
  signOperation,
  broadcast,
};
const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => Promise.resolve({}),
  hydrate: () => {},
};
export default {
  currencyBridge,
  accountBridge,
};
