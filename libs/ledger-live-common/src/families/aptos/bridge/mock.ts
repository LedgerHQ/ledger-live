import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import type { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../logic";
import {
  scanAccounts,
  signOperation,
  broadcast,
  sync,
  makeAccountBridgeReceive,
} from "../../../bridge/mockHelpers";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getMainAccount } from "../../../account";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => ({
  family: "aptos",
  mode: "send",
  amount: BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0.0001),
  options: {
    maxGasAmount: DEFAULT_GAS.toString(),
    gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
  },
});

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!isAddressValid())
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  else if (recipient.toLowerCase() === address.toLowerCase())
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();

  if (!isAddressValid())
    errors.sender = new InvalidAddress("", {
      currencyName: a.currency.name,
    });

  let estimatedFees = t.fees;

  if (!estimatedFees) estimatedFees = new BigNumber(0);

  let totalSpent = BigNumber(0);

  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (!useAllAmount) {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }

    if (totalSpent.gt(a.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const { address } = getAddress(a);
  const { recipient } = t;

  if (recipient && address) {
    if (t.useAllAmount) {
      const amount = a.spendableBalance.minus(t.fees ? t.fees : new BigNumber(0));
      return { ...t, amount };
    }
  }

  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  let balance = a.spendableBalance;

  if (balance.eq(0)) return balance;

  const estimatedFees = transaction?.fees ?? getEstimatedFees();

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};

const preload = async () => ({});

const hydrate = () => {};

const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

const isAddressValid = (): boolean => {
  try {
    return true;
  } catch (err) {
    return false;
  }
};

const getEstimatedFees = (): BigNumber => {
  return new BigNumber(0);
};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  getSerializedAddressParameters,
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
  estimateMaxSpendable,
};

export default {
  currencyBridge,
  accountBridge,
};
