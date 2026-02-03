import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { NotEnoughBalance, RecipientRequired } from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-aleo/types/index";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../../account";
import {
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration } from "../../../config";
import { validateAddress } from "../../../bridge/validateAddress";
import aleoConfig, { type AleoCoinConfig } from "@ledgerhq/coin-aleo/config";

const receive = makeAccountBridgeReceive();
const estimateFees = (_a, _t: Transaction) => new BigNumber(50000);

const createTransaction = (): Transaction => ({
  family: "aleo",
  amount: new BigNumber(100000),
  recipient: "",
  useAllAmount: false,
});

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  if (parentAccount) return Promise.resolve(account.balance);
  const mainAccount = getMainAccount(account, parentAccount);
  let estimatedFees = new BigNumber(50000);
  if (transaction) {
    estimatedFees = estimateFees(mainAccount, transaction);
  }
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const useAllAmount = Boolean(transaction.useAllAmount);
  const estimatedFees = estimateFees(account, transaction);

  let totalSpent: BigNumber;
  if (useAllAmount) {
    totalSpent = account.balance;
  } else {
    totalSpent = new BigNumber(transaction.amount).plus(estimatedFees);
  }

  let amount: BigNumber;
  if (useAllAmount) {
    amount = account.balance.minus(estimatedFees);
  } else {
    amount = new BigNumber(transaction.amount);
  }

  if (totalSpent.gt(account.balance)) {
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
  return {
    ...t,
    fees: new BigNumber(50000),
  };
};

let isConfigLoaded = false;
const loadCoinConfig = () => {
  if (!isConfigLoaded) {
    aleoConfig.setCoinConfig((currency?: CryptoCurrency) => {
      invariant(currency, "aleo: currency is undefined in mock loadCoinConfig");
      isConfigLoaded = true;
      return getCurrencyConfiguration<AleoCoinConfig>(currency);
    });
  }
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
  signRawOperation,
  broadcast,
  getSerializedAddressParameters,
  validateAddress,
};
const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
export default {
  currencyBridge,
  accountBridge,
  loadCoinConfig,
};
