import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
  HederaInsufficientFundsForAssociation,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
} from "@ledgerhq/errors";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account";
import { getEnv } from "@ledgerhq/live-env";
import { isTokenAssociateTransaction, isTokenAssociationRequired } from "../logic";
import type { HederaOperationType, Transaction, TransactionStatus } from "../types";
import {
  calculateAmount,
  checkAccountTokenAssociationStatus,
  getCurrencyToUSDRate,
  getEstimatedFees,
} from "./utils";

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (isTokenAssociateTransaction(transaction)) {
    const [usdRate, estimatedFees] = await Promise.all([
      getCurrencyToUSDRate(account.currency),
      getEstimatedFees(account, "TokenAssociate"),
    ]);

    const amount = BigNumber(0);
    const totalSpent = amount.plus(estimatedFees);
    const hbarBalance = account.balance.dividedBy(10 ** account.currency.units[0].magnitude);
    const currentWorthInUSD = usdRate ? hbarBalance.multipliedBy(usdRate) : new BigNumber(0);
    const requiredWorthInUSD = getEnv("HEDERA_TOKEN_ASSOCIATION_MIN_USD");
    const isAssociationFlow = isTokenAssociationRequired(account, transaction.properties.token);

    if (isAssociationFlow && currentWorthInUSD.isLessThan(requiredWorthInUSD)) {
      errors.insufficientAssociateBalance = new HederaInsufficientFundsForAssociation("", {
        requiredWorthInUSD,
      });
    }

    return {
      amount,
      errors,
      estimatedFees,
      totalSpent,
      warnings,
    };
  }

  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);
  const operationType: HederaOperationType = isTokenTransaction
    ? "TokenTransfer"
    : "CryptoTransfer";

  if (!transaction.recipient || transaction.recipient.length === 0) {
    errors.recipient = new RecipientRequired();
  } else {
    if (account.freshAddress === transaction.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    try {
      AccountId.fromString(transaction.recipient);
    } catch (err) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
  }

  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    getEstimatedFees(account, operationType),
  ]);

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (isTokenTransaction) {
    if (!errors.recipient) {
      try {
        const hasRecipientTokenAssociated = await checkAccountTokenAssociationStatus(
          transaction.recipient,
          subAccount.token.contractAddress,
        );

        if (!hasRecipientTokenAssociated) {
          warnings.missingAssociation = new HederaRecipientTokenAssociationRequired();
        }
      } catch {
        warnings.unverifiedAssociation = new HederaRecipientTokenAssociationUnverified();
      }
    }

    if (subAccount.balance.isLessThan(calculatedAmount.totalSpent)) {
      errors.amount = new NotEnoughBalance();
    }

    if (account.balance.isLessThan(estimatedFees)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    if (transaction.amount.eq(0) && !transaction.useAllAmount) {
      errors.amount = new AmountRequired();
    }

    if (account.balance.isLessThan(calculatedAmount.totalSpent)) {
      errors.amount = new NotEnoughBalance("");
    }
  }

  return {
    amount: calculatedAmount.amount,
    errors,
    estimatedFees,
    totalSpent: calculatedAmount.totalSpent,
    warnings,
  };
};
