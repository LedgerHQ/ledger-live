import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
  AmountRequired,
  DustLimit,
} from "@ledgerhq/errors";
import type { Transaction } from "@ledgerhq/coin-bitcoin/types";
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
import { getMainAccount } from "../../../account";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/coin-bitcoin/wallet-btc/crypto/factory";
import { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import { computeDustAmount } from "@ledgerhq/coin-bitcoin/wallet-btc/utils";
import { getFeeItems } from "./api";

const receive = makeAccountBridgeReceive();

const defaultGetFees = (a, t: any) => (t.feePerByte || new BigNumber(0)).times(250);

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

const estimateMaxSpendable = ({ account, parentAccount, transaction }): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : new BigNumber(5000);
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account, t) => {
  const errors: { [key: string]: any } = {};
  const warnings: { [key: string]: any } = {};
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = defaultGetFees(account, t);
  const totalSpent = useAllAmount ? account.balance : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount ? account.balance.minus(estimatedFees) : new BigNumber(t.amount);

  if (!errors.amount && !amount.gt(0)) {
    errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  }

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  // Fill up transaction errors...
  if (!errors.amount && totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (t.feePerByte) {
    const txSize = Math.ceil(estimatedFees.toNumber() / t.feePerByte.toNumber());
    const crypto = cryptoFactory(account.currency.id as Currency);

    if (amount.gt(0) && amount.lt(computeDustAmount(crypto, txSize))) {
      errors.dustLimit = new DustLimit();
    }
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

const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  // TODO it needs to set the fee if not in t as well
  if (!transaction.networkInfo) {
    const feeItems = await getFeeItems(account.currency);
    return {
      ...transaction,
      networkInfo: {
        family: "bitcoin",
        feeItems: feeItems,
      },
    };
  }

  return transaction;
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
  getSerializedAddressParameters,
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
