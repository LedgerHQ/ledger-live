import { BigNumber } from "bignumber.js";
import isEqual from "lodash/isEqual";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { DustLimit } from "@ledgerhq/coin-bitcoin/errors";
import {
  defaultUtxoStrategy,
  getFamilySpecificData,
  getFeePerByte,
  type BitcoinFeeParametersJson,
  type Transaction,
} from "../types";
import {
  makeAccountBridgeReceive,
  scanAccounts,
  signOperation,
  signRawOperation,
  broadcast,
  sync,
  isInvalidRecipient,
} from "../../../bridge/mockHelpers";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getMainAccount } from "../../../account";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getBitcoinEstimationRecipient } from "@ledgerhq/coin-bitcoin/api";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import { computeDustAmount } from "@ledgerhq/wallet-btc/utils";
import { validateAddress } from "../../../bridge/validateAddress";

const receive = makeAccountBridgeReceive();

const defaultGetFees = (_account: Account, t: Transaction) =>
  (getFeePerByte(t) ?? new BigNumber(0)).times(250);

const createTransaction = (): Transaction => ({
  family: "bitcoin",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  feesStrategy: "medium",
  familySpecificData: { utxoStrategy: defaultUtxoStrategy(), feePerByte: "10" },
});

const FEE_RATES = { fast: "4", medium: "3", slow: "2" } as const;

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

  const feePerByte = getFeePerByte(t);
  if (feePerByte) {
    const txSize = Math.ceil(estimatedFees.toNumber() / feePerByte.toNumber());
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
  _account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const { feesStrategy } = transaction;
  const preset = feesStrategy && feesStrategy !== "custom" ? FEE_RATES[feesStrategy] : undefined;
  const feePerByte = preset ?? getFamilySpecificData(transaction).feePerByte ?? FEE_RATES.medium;
  const feeParameters: BitcoinFeeParametersJson = {
    feePerByte,
    feeRates: { ...FEE_RATES },
    relayFeePerByte: "1",
  };
  const next = { ...transaction, fees: new BigNumber(feePerByte).times(250), feeParameters };
  return isEqual(next, transaction) ? transaction : next;
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
  signRawOperation,
  broadcast,
  getSerializedAddressParameters,
  validateAddress,
  getEstimationRecipient: account => getBitcoinEstimationRecipient(account.currency.id),
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
