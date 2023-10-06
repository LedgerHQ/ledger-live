import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { TransactionStatus } from "./types";
import type { Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";
import { isValid } from "./utils/address-utils";
import BigNumber from "bignumber.js";
import { NotEnoughVTHO } from "./errors";
import { calculateTransactionInfo } from "./utils/transaction-utils";

const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const { freshAddress, currency, subAccounts } = account;
  const { body, recipient, amount } = transaction;
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { isTokenAccount, spendableBalance } = await calculateTransactionInfo(
    account,
    transaction,
    {
      estimatedGas: body.gas as number,
      estimatedGasFees: new BigNumber(transaction.estimatedFees),
    },
  );

  if (!body || !body.gas) {
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
  const estimatedFees = new BigNumber(transaction.estimatedFees);
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

export default getTransactionStatus;
