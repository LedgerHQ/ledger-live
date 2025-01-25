import { BigNumber } from "bignumber.js";
import { NotEnoughBalance, RecipientRequired } from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-evm/types/index";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../../account";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getGasLimit } from "@ledgerhq/coin-evm/logic";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
const receive = makeAccountBridgeReceive();
const defaultGetFees = (_a, t: any) => (t.gasPrice || new BigNumber(0)).times(getGasLimit(t));

const createTransaction = (): Transaction => ({
  family: "evm",
  mode: "send",
  amount: new BigNumber(10000000000),
  nonce: 0,
  recipient: "",
  gasPrice: new BigNumber(10000000000),
  gasLimit: new BigNumber(21000),
  chainId: 2222,
  useAllAmount: false,
  subAccountId: null,
});

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  if (parentAccount) return Promise.resolve(account.balance);
  const mainAccount = getMainAccount(account, parentAccount);
  let estimatedFees = new BigNumber(1000000000000);
  if (transaction) {
    estimatedFees = defaultGetFees(mainAccount, transaction);
  }
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account, transaction) => {
  const errors: {
    amount?: Error;
    recipient?: Error;
  } = {};

  const warnings: {
    feeTooHigh?: Error;
    gasLimit?: Error;
  } = {};

  let tokenAccount = null;
  if (transaction.subAccountId) {
    tokenAccount = account.subAccounts?.find(ta => ta.id === transaction.subAccountId);
  }

  const currentAccount = tokenAccount || account;
  const useAllAmount = Boolean(transaction.useAllAmount);
  const estimatedFees = defaultGetFees(account, transaction);

  let totalSpent: BigNumber;
  if (useAllAmount) {
    totalSpent = currentAccount.balance;
  } else if (tokenAccount) {
    totalSpent = new BigNumber(transaction.amount);
  } else {
    totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  }

  let amount: BigNumber;
  if (useAllAmount) {
    if (tokenAccount) {
      amount = currentAccount.balance;
    } else {
      amount = currentAccount.balance.minus(estimatedFees);
    }
  } else {
    amount = new BigNumber(transaction.amount);
  }

  // Fill up transaction errors...
  if (totalSpent.gt(currentAccount.balance)) {
    errors.amount = new NotEnoughBalance();
  }
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const prepareTransaction = async (_a, t) => {
  const typedTransaction = getTypedTransaction(t, {
    gasPrice: new BigNumber(50),
    maxFeePerGas: new BigNumber(50),
    maxPriorityFeePerGas: new BigNumber(50),
    nextBaseFee: new BigNumber(50),
  });
  return typedTransaction;
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
