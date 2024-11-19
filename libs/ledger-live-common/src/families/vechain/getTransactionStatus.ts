import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { calculateTransactionInfo } from "./utils/transaction-utils";
import { isValid } from "./utils/address-utils";
import type { Transaction } from "./types";
import { NotEnoughVTHO } from "./errors";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
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
