import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getAddress, isAddressValid } from "./bridgeHelpers/addresses";
import { CasperAccount, Transaction, TransactionStatus } from "../types";
import { isTransferIdValid } from "./bridgeHelpers/transferId";
import { CasperInvalidTransferId } from "../errors";
import {
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
  CASPER_MAX_TRANSFER_ID,
  MayBlockAccountError,
  InvalidMinimumAmountError,
} from "../consts";

export const getTransactionStatus: AccountBridge<
  Transaction,
  CasperAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance, spendableBalance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount } = transaction;
  let { amount } = transaction;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isAddressValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isAddressValid(address)) {
    errors.sender = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (!isTransferIdValid(transaction.transferId)) {
    errors.sender = new CasperInvalidTransferId("", {
      maxTransferId: CASPER_MAX_TRANSFER_ID,
    });
  }

  const estimatedFees = transaction.fees;

  let totalSpent = new BigNumber(0);

  if (useAllAmount) {
    totalSpent = account.spendableBalance;
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

    if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (amount.lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES) && !errors.amount) {
    errors.amount = InvalidMinimumAmountError;
  }

  if (
    spendableBalance.minus(totalSpent).minus(estimatedFees).lt(CASPER_MINIMUM_VALID_AMOUNT_MOTES)
  ) {
    warnings.amount = MayBlockAccountError;
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
