import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
} from "@ledgerhq/errors";
import { ClaimRewardsFeesWarning } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { isValidAddress } from "algosdk";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";

import { computeAlgoMaxSpendable, isAmountValid, recipientHasAsset } from "./bridgeLogic";
import { AlgorandASANotOptInInRecipient, AlgorandMemoExceededSizeError } from "./errors";

import { validateMemo } from "./logic/validateMemo";
import { extractTokenId } from "./tokens";
import type { AlgorandAccount, Transaction, TransactionStatus } from "./types";

/*
 * Here are the list of the differents things we check
 * - Check if recipient is the same in case of send
 * - Check if recipient is valid
 * - Check if amounts are set
 * - Check if fees are loaded
 * - Check if is a send Max and set the amount
 * - Check if Token is already optin at the recipient
 * - Check if memo is too long
 */
export const getTransactionStatus: AccountBridge<
  Transaction,
  AlgorandAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const tokenAccount = !transaction.subAccountId
    ? null
    : account.subAccounts && account.subAccounts.find(ta => ta.id === transaction.subAccountId);

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await isValidAddress(transaction.recipient))) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (transaction.mode === "send" && account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);
  let amount = transaction.amount;
  let totalSpent = estimatedFees;

  invariant((account as AlgorandAccount).algorandResources, "Algorand family expected");
  const algorandResources = (account as AlgorandAccount).algorandResources;

  const algoSpendableBalance = computeAlgoMaxSpendable({
    accountBalance: account.balance,
    nbAccountAssets: algorandResources.nbAssets,
    mode: transaction.mode,
  });

  switch (transaction.mode) {
    case "send": {
      if (amount.lte(0) && !transaction.useAllAmount) {
        errors.amount = new AmountRequired();
      }

      if (!transaction.fees || !transaction.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      if (
        tokenAccount &&
        tokenAccount.type === "TokenAccount" &&
        !errors.recipient &&
        !(await recipientHasAsset(transaction.recipient, extractTokenId(tokenAccount.token.id)))
      ) {
        errors.recipient = new AlgorandASANotOptInInRecipient();
      }

      amount = transaction.useAllAmount
        ? tokenAccount
          ? tokenAccount.balance
          : algoSpendableBalance.minus(estimatedFees)
        : amount;

      if (amount.lt(0)) {
        amount = new BigNumber(0);
      }

      totalSpent = tokenAccount ? amount : amount.plus(estimatedFees);

      if (!errors.recipient && !(await isAmountValid(transaction.recipient, amount))) {
        errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
          minimalAmount: "0.1 ALGO",
        });
      }

      if (!tokenAccount && amount.gt(0) && estimatedFees.times(10).gt(amount)) {
        warnings.feeTooHigh = new FeeTooHigh();
      }

      if (
        (amount.lte(0) && transaction.useAllAmount) || // if use all Amount sets an amount at 0
        (!errors.recipient && !errors.amount && tokenAccount
          ? totalSpent.gt(tokenAccount.balance)
          : totalSpent.gt(algoSpendableBalance)) // if spendable balance lower than total
      ) {
        errors.amount = new NotEnoughBalance();
      }

      // if spendable balance lower than fees for token
      if (!errors.amount && tokenAccount && algoSpendableBalance.lt(estimatedFees)) {
        errors.amount = new NotEnoughBalanceInParentAccount();
      }

      break;
    }

    case "optIn": {
      if (!transaction.fees || !transaction.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      // This error doesn't need to be translate,
      // it will use to block until the user choose an assetId
      if (!transaction.assetId) {
        errors.assetId = new Error("Asset Id is not set");
      }

      if (algoSpendableBalance.lt(estimatedFees)) {
        errors.amount = new NotEnoughBalance();
      }

      break;
    }

    case "claimReward": {
      if (algoSpendableBalance.lt(totalSpent)) {
        errors.amount = new NotEnoughBalance();
      }

      if (estimatedFees.gt(algorandResources.rewards)) {
        warnings.claimReward = new ClaimRewardsFeesWarning();
      }

      break;
    }
  }

  if (!validateMemo(transaction.memo)) {
    errors.transaction = new AlgorandMemoExceededSizeError();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
