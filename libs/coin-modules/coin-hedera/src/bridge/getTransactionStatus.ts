import BigNumber from "bignumber.js";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { Account, AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account";
import { getEnv } from "@ledgerhq/live-env";
import { HEDERA_OPERATION_TYPES } from "../constants";
import {
  HederaInsufficientFundsForAssociation,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
} from "../errors";
import { estimateFees } from "../logic/estimateFees";
import {
  isTokenAssociateTransaction,
  isTokenAssociationRequired,
  getCurrencyToUSDRate,
  checkAccountTokenAssociationStatus,
  safeParseAccountId,
} from "../logic/utils";
import type { Transaction, TransactionStatus, TransactionTokenAssociate } from "../types";
import { calculateAmount } from "./utils";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

function validateRecipient(account: Account, recipient: string): Error | null {
  if (!recipient || recipient.length === 0) {
    return new RecipientRequired();
  }

  const [parsingError, parsingResult] = safeParseAccountId(recipient);

  if (parsingError) {
    return parsingError;
  }

  const recipientWithoutChecksum = parsingResult.accountId;

  if (account.freshAddress === recipientWithoutChecksum) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

async function handleTokenAssociateTransaction(
  account: Account,
  transaction: TransactionTokenAssociate,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [usdRate, estimatedFees] = await Promise.all([
    getCurrencyToUSDRate(account.currency),
    estimateFees(account.currency, HEDERA_OPERATION_TYPES.TokenAssociate),
  ]);

  const amount = BigNumber(0);
  const totalSpent = amount.plus(estimatedFees);
  const isAssociationFlow = isTokenAssociationRequired(account, transaction.properties.token);

  if (isAssociationFlow) {
    const hbarBalance = account.balance.dividedBy(10 ** account.currency.units[0].magnitude);
    const currentWorthInUSD = usdRate ? hbarBalance.multipliedBy(usdRate) : new BigNumber(0);
    const requiredWorthInUSD = getEnv("HEDERA_TOKEN_ASSOCIATION_MIN_USD");

    if (currentWorthInUSD.isLessThan(requiredWorthInUSD)) {
      errors.insufficientAssociateBalance = new HederaInsufficientFundsForAssociation("", {
        requiredWorthInUSD,
      });
    }
  }

  return {
    amount,
    totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
}

async function handleTokenTransaction(
  account: Account,
  subAccount: TokenAccount,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};
  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    estimateFees(account.currency, HEDERA_OPERATION_TYPES.TokenTransfer),
  ]);

  const recipientError = validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

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

  if (transaction.amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  if (subAccount.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance();
  }

  if (account.balance.isLessThan(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
}

async function handleCoinTransaction(
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> {
  const errors: Errors = {};
  const warnings: Warnings = {};
  const [calculatedAmount, estimatedFees] = await Promise.all([
    calculateAmount({ transaction, account }),
    estimateFees(account.currency, HEDERA_OPERATION_TYPES.CryptoTransfer),
  ]);

  const recipientError = validateRecipient(account, transaction.recipient);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  if (transaction.amount.eq(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (account.balance.isLessThan(calculatedAmount.totalSpent)) {
    errors.amount = new NotEnoughBalance("");
  }

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);

  if (isTokenAssociateTransaction(transaction)) {
    return handleTokenAssociateTransaction(account, transaction);
  } else if (isTokenTransaction) {
    return handleTokenTransaction(account, subAccount, transaction);
  } else {
    return handleCoinTransaction(account, transaction);
  }
};
