import { isValidAddress } from "@celo/utils/lib/address";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { CeloAllFundsWarning } from "../errors";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { celoKit } from "../network/sdk";
import { CeloAccount, Transaction, TransactionStatus } from "../types";
import { isSameTokenAsFee, convertNumberDecimals, normalizeAndSubtract } from "./utils";

const kit = celoKit();

// Arbitrary buffer for paying fees of next transactions. 0.05 Celo for ~100 transactions
const FEES_SAFETY_BUFFER = new BigNumber(5000000000000000);

export const getTransactionStatus: AccountBridge<
  Transaction,
  CeloAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;

  if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!transaction.fees || !transaction.fees.gt(0)) {
    errors.fees = new FeeNotLoaded();
  }

  const pendingOperationAmounts = getPendingStakingOperationAmounts(account);
  const lockedGold = await kit.contracts.getLockedGold();
  const nonvotingLockedGoldBalance = await lockedGold.getAccountNonvotingLockedGold(
    account.freshAddress,
  );
  // Deduct pending vote operations from the non-voting locked balance
  const totalNonVotingLockedBalance = nonvotingLockedGoldBalance.minus(
    pendingOperationAmounts.vote,
  );

  // Deduct pending lock operations from the spendable balance
  const totalSpendableBalance = account.spendableBalance.minus(pendingOperationAmounts.lock);
  const estimatedFees = transaction.fees || new BigNumber(0);

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  // Determine if we're paying fees in the same currency we're sending
  const sameTokenAsFee = isSameTokenAsFee(
    isTokenTransaction,
    tokenAccount?.token?.contractAddress,
    transaction.feeCurrencyUnwrapped,
  );

  let amount: BigNumber = new BigNumber(0);
  if (useAllAmount && (transaction.mode === "unlock" || transaction.mode === "vote")) {
    amount = totalNonVotingLockedBalance ?? new BigNumber(0);
  } else if (useAllAmount && transaction.mode === "revoke") {
    const revoke = getVote(account, transaction.recipient, transaction.index);
    if (revoke?.amount) amount = revoke.amount;
  } else if (useAllAmount) {
    if (isTokenTransaction) {
      amount = sameTokenAsFee
        ? convertNumberDecimals(
            normalizeAndSubtract(
              tokenAccount.spendableBalance,
              estimatedFees,
              tokenAccount?.token.units[0].magnitude,
            ),
            tokenAccount?.token.units[0].magnitude,
          )
        : tokenAccount.spendableBalance;
    } else {
      amount = sameTokenAsFee ? totalSpendableBalance.minus(estimatedFees) : totalSpendableBalance;
    }
  } else {
    amount = new BigNumber(transaction.amount);
  }

  if (amount.lt(0)) amount = new BigNumber(0);

  if (
    (account.celoResources?.lockedBalance.gt(0) ||
      !!account.celoResources?.pendingWithdrawals?.length) &&
    (transaction.useAllAmount || totalSpendableBalance.minus(amount).lt(FEES_SAFETY_BUFFER)) &&
    ["send", "lock"].includes(transaction.mode)
  ) {
    warnings.amount = new CeloAllFundsWarning();
  }

  if (!["register", "withdraw", "activate"].includes(transaction.mode)) {
    if (amount.lte(0) && !useAllAmount) {
      errors.amount = new AmountRequired();
    }
  }

  const feeTokenAccount = findSubAccountById(account, transaction.feeCurrencyAccountId ?? "");
  const feesForTotalSpent = feeTokenAccount
    ? convertNumberDecimals(estimatedFees, feeTokenAccount.token.units[0].magnitude)
    : estimatedFees;

  // Calculate totalSpent - only add fees if paying in the same currency
  const totalSpent = sameTokenAsFee ? amount.plus(feesForTotalSpent) : amount;

  if (transaction.mode === "unlock" || transaction.mode === "vote") {
    if (!errors.amount && totalNonVotingLockedBalance && amount.gt(totalNonVotingLockedBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else if (transaction.mode === "revoke") {
    const revoke = getVote(account, transaction.recipient, transaction.index);
    if (!errors.amount && revoke?.amount && amount.gt(revoke.amount))
      errors.amount = new NotEnoughBalance();
  } else {
    const balanceToCheck =
      isTokenTransaction && tokenAccount ? tokenAccount.spendableBalance : totalSpendableBalance;

    const amountToCheck = sameTokenAsFee ? totalSpent : amount;
    if (!errors.amount && amountToCheck.gt(balanceToCheck)) {
      errors.amount = new NotEnoughBalance();
    }

    // When fees are paid in a different currency, verify fee token balance is sufficient
    if (!errors.fees && !sameTokenAsFee) {
      if (feeTokenAccount) {
        const feeTokenBalance = feeTokenAccount.spendableBalance;
        if (feesForTotalSpent.gt(feeTokenBalance)) {
          errors.fees = new NotEnoughBalance();
        }
      } else if (isTokenTransaction) {
        // Fees paid in native CELO — check main account spendable balance
        if (estimatedFees.gt(totalSpendableBalance)) {
          errors.fees = new NotEnoughBalance();
        }
      }
    }

    // When fees are paid in native CELO for a token transaction, verify the main account has enough CELO for gas
    if (!errors.fees && isTokenTransaction && !sameTokenAsFee && !feeTokenAccount) {
      if (totalSpendableBalance.lt(estimatedFees)) {
        errors.fees = new NotEnoughBalance();
      }
    }
  }

  if (transaction.mode === "send") {
    if (!transaction.recipient && !errors.recipient) {
      errors.recipient = new RecipientRequired();
    } else if (!isValidAddress(transaction.recipient) && !errors.recipient) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }

    if (isTokenTransaction) {
      // For token transactions, totalSpent depends on whether fees are in the same token
      // If fees are in a different token, we can only show the amount (can't add different currencies)
      // If fees are in the same token, show amount + fees (both already in token's decimals)
      return {
        errors,
        warnings,
        estimatedFees: feesForTotalSpent,
        amount,
        totalSpent,
      };
    }
  }

  return {
    errors,
    warnings,
    estimatedFees: feesForTotalSpent,
    amount,
    totalSpent,
  };
};

export default getTransactionStatus;
