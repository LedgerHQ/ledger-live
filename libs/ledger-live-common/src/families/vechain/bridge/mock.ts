import { AccountBridge, CurrencyBridge, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import { scanAccounts, signOperation, broadcast, sync } from "../../../bridge/mockHelpers";
import { makeAccountBridgeReceive } from "../../../bridge/mockHelpers";
import BigNumber from "bignumber.js";
import { DEFAULT_GAS_COEFFICIENT, MAINNET_CHAIN_TAG } from "../constants";
import { calculateTransactionInfo, generateNonce } from "../utils/transaction-utils";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { NotEnoughVTHO } from "../errors";
import { isValid } from "../utils/address-utils";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: async () => Promise.resolve({}),
  hydrate: (): void => {},
};

const estimateMaxSpendable = ({ account }) => {
  return account.balance;
};

const createTransaction = (): Transaction => ({
  amount: new BigNumber(0),
  useAllAmount: false,
  family: "vechain",
  estimatedFees: "0",
  recipient: "",
  body: {
    chainTag: MAINNET_CHAIN_TAG,
    blockRef: "",
    expiration: 18,
    clauses: [],
    gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
    gas: "0",
    dependsOn: null,
    nonce: generateNonce(),
  },
});

const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const { freshAddress, currency, subAccounts } = account;
  const { body, recipient, subAccountId } = transaction;
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const tokenAccount =
    subAccountId && subAccounts
      ? (subAccounts.find(subAccount => {
          return subAccount.id === subAccountId;
        }) as TokenAccount)
      : undefined;
  const isTokenAccount = !!tokenAccount;
  const estimatedFees = new BigNumber(transaction.estimatedFees);

  const { amount, spendableBalance } = await calculateTransactionInfo(account, transaction, {
    estimatedGas: body.gas as number,
    estimatedGasFees: estimatedFees,
  });

  if (!body?.gas) {
    errors.fees = new FeeNotLoaded();
  }

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (freshAddress.toLowerCase() === recipient.toLowerCase()) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: currency.name,
    });
  }

  if (!amount.gt(0)) {
    if (!transaction.useAllAmount) errors.amount = new AmountRequired();
    else errors.amount = new NotEnoughBalance();
  } else {
    if (amount.gt(spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (!isTokenAccount) {
      // vet
      const vthoBalance = subAccounts?.[0].balance;
      if (estimatedFees.gt(vthoBalance || 0)) {
        errors.amount = new NotEnoughVTHO();
      }
    }
  }

  let totalSpent = amount;
  if (isTokenAccount) {
    totalSpent = amount.plus(estimatedFees);
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  return transaction;
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
