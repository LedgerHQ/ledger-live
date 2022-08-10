import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { isValidAddress } from "algosdk";

import {
  RecipientRequired,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  FeeNotLoaded,
  FeeTooHigh,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  InvalidAddress,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import {
  ClaimRewardsFeesWarning,
  AlgorandASANotOptInInRecipient,
} from "../../errors";
import type { Transaction, AlgorandAccount } from "./types";
import { extractTokenId } from "./tokens";
import {
  ALGORAND_MAX_MEMO_SIZE,
  recipientHasAsset,
  isAmountValid,
  computeAlgoMaxSpendable,
} from "./logic";

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
export const getTransactionStatus = async (a: Account, t: Transaction) => {
  const errors: any = {};
  const warnings: any = {};
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find((ta) => ta.id === t.subAccountId);

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await isValidAddress(t.recipient))) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (t.mode === "send" && a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const estimatedFees = t.fees || new BigNumber(0);
  let amount = t.amount;
  let totalSpent = estimatedFees;

  invariant(
    (a as AlgorandAccount).algorandResources,
    "Algorand family expected"
  );
  const algorandResources = (a as AlgorandAccount).algorandResources;

  const algoSpendableBalance = computeAlgoMaxSpendable({
    accountBalance: a.balance,
    nbAccountAssets: algorandResources.nbAssets,
    mode: t.mode,
  });

  switch (t.mode) {
    case "send": {
      if (amount.lte(0) && !t.useAllAmount) {
        errors.amount = new AmountRequired();
      }

      if (!t.fees || !t.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      if (
        tokenAccount &&
        tokenAccount.type === "TokenAccount" &&
        !errors.recipient &&
        !(await recipientHasAsset(
          t.recipient,
          extractTokenId(tokenAccount.token.id)
        ))
      ) {
        errors.recipient = new AlgorandASANotOptInInRecipient();
      }

      amount = t.useAllAmount
        ? tokenAccount
          ? tokenAccount.balance
          : algoSpendableBalance.minus(estimatedFees)
        : amount;

      if (amount.lt(0)) {
        amount = new BigNumber(0);
      }

      totalSpent = tokenAccount ? amount : amount.plus(estimatedFees);

      if (!errors.recipient && !(await isAmountValid(t.recipient, amount))) {
        errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
          minimalAmount: "0.1 ALGO",
        });
      }

      if (!tokenAccount && amount.gt(0) && estimatedFees.times(10).gt(amount)) {
        warnings.feeTooHigh = new FeeTooHigh();
      }

      if (
        (amount.lte(0) && t.useAllAmount) || // if use all Amount sets an amount at 0
        (!errors.recipient && !errors.amount && tokenAccount
          ? totalSpent.gt(tokenAccount.balance)
          : totalSpent.gt(algoSpendableBalance)) // if spendable balance lower than total
      ) {
        errors.amount = new NotEnoughBalance();
      }

      // if spendable balance lower than fees for token
      if (
        !errors.amount &&
        tokenAccount &&
        algoSpendableBalance.lt(estimatedFees)
      ) {
        errors.amount = new NotEnoughBalanceInParentAccount();
      }

      break;
    }

    case "optIn": {
      if (!t.fees || !t.fees.gt(0)) {
        errors.fees = new FeeNotLoaded();
      }

      // This error doesn't need to be translate,
      // it will use to block until the user choose an assetId
      if (!t.assetId) {
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

  if (t.memo && t.memo.length > ALGORAND_MAX_MEMO_SIZE) {
    throw new Error("Memo is too long");
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};
