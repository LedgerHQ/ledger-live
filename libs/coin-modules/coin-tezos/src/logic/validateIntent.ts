import type { TransactionIntent, TransactionValidation } from "@ledgerhq/coin-framework/api/types";
import {
  InvalidAddress,
  RecipientRequired,
  RecommendUndelegation,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { validateAddress, ValidationResult } from "@taquito/utils";
import api from "../network/tzkt";
import { estimateFees } from "./estimateFees";
import { InvalidAddressBecauseAlreadyDelegated } from "../types/errors";
import { mapIntentTypeToTezosMode } from "../utils";

/**
 * Validates basic recipient and amount for send transactions
 */
function validateBasicSendParams(intent: TransactionIntent): Record<string, Error> {
  const errors: Record<string, Error> = {};

  if (intent.type !== "send") {
    return errors;
  }

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (validateAddress(intent.recipient) !== ValidationResult.VALID) {
    errors.recipient = new InvalidAddress(undefined, { currencyName: "Tezos" });
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (intent.amount === 0n && !intent.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (intent.amount < 0n) {
    errors.amount = new NotEnoughBalance();
  }

  return errors;
}

/**
 * Validates specific transaction constraints based on account state
 */
function validateTransactionConstraints(
  intent: TransactionIntent,
  senderInfo: any,
): Record<string, Error> {
  const errors: Record<string, Error> = {};

  // send max not allowed on delegated accounts (must undelegate acc first)
  if (intent.type === "send" && intent.useAllAmount) {
    if (senderInfo.type === "user" && senderInfo.delegate?.address) {
      errors.amount = new RecommendUndelegation();
    }
  }

  // stake requires non-zero balance
  if (intent.type === "stake") {
    const balance = BigInt(senderInfo.balance || "0");
    if (balance === 0n) {
      errors.amount = new NotEnoughBalanceToDelegate();
    }
  }

  return errors;
}

/**
 * Maps Taquito-specific errors to our error types
 */
function mapTaquitoErrors(taquitoError: string, intentType: string): Record<string, Error> {
  const errors: Record<string, Error> = {};

  if (taquitoError.endsWith("balance_too_low") || taquitoError.endsWith("subtraction_underflow")) {
    if (intentType === "stake") {
      errors.amount = new NotEnoughBalanceToDelegate();
    } else {
      errors.amount = new NotEnoughBalance();
    }
  } else if (taquitoError.endsWith("delegate.unchanged") && intentType === "stake") {
    errors.recipient = new InvalidAddressBecauseAlreadyDelegated();
  } else if (taquitoError.includes("empty_implicit_contract")) {
    errors.amount = new NotEnoughBalanceToDelegate();
  } else {
    errors.amount = new Error(taquitoError);
  }

  return errors;
}

/**
 * Calculates final amounts based on transaction type
 */
function calculateAmounts(
  intent: TransactionIntent,
  senderInfo: any,
  estimatedFees: bigint,
  estimatedAmount: bigint | undefined,
): { amount: bigint; totalSpent: bigint } {
  if (intent.type === "stake" || intent.type === "unstake") {
    return { amount: 0n, totalSpent: estimatedFees };
  }

  if (intent.type === "send" && intent.useAllAmount) {
    if (senderInfo.type === "user") {
      const balance = BigInt(senderInfo.balance);
      const amount = estimatedAmount ?? (balance > estimatedFees ? balance - estimatedFees : 0n);
      return { amount, totalSpent: amount + estimatedFees };
    }
    return { amount: 0n, totalSpent: 0n };
  }

  const amount = intent.amount;
  return { amount, totalSpent: amount + estimatedFees };
}

/**
 * Validates balance coverage for the transaction
 */
function validateBalanceCoverage(senderInfo: any, totalSpent: bigint): Record<string, Error> {
  const errors: Record<string, Error> = {};

  if (senderInfo.type === "user") {
    const accountBalance = BigInt(senderInfo.balance);
    if (totalSpent > accountBalance) {
      errors.amount = new NotEnoughBalance();
    }
  }

  return errors;
}

export async function validateIntent(intent: TransactionIntent): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  let estimatedFees: bigint;
  let estimatedAmount: bigint | undefined;
  let amount: bigint;
  let totalSpent: bigint;

  // Basic validation for send transactions
  const basicErrors = validateBasicSendParams(intent);
  Object.assign(errors, basicErrors);

  if (Object.keys(errors).length > 0) {
    return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
  }

  try {
    // Get sender account information
    const senderInfo = await api.getAccountByAddress(intent.sender);
    if (senderInfo.type !== "user") throw new Error("unexpected account type");

    // Validate transaction-specific constraints
    const constraintErrors = validateTransactionConstraints(intent, senderInfo);
    Object.assign(errors, constraintErrors);

    if (Object.keys(errors).length > 0) {
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }

    // Estimate fees
    if (senderInfo.revealed) {
      const estimation = await estimateFees({
        account: {
          address: intent.sender,
          revealed: senderInfo.revealed,
          balance: BigInt(senderInfo.balance),
          xpub: intent.senderPublicKey ?? senderInfo.publicKey,
        },
        transaction: {
          mode: mapIntentTypeToTezosMode(intent.type),
          recipient: intent.recipient,
          amount: intent.amount,
          useAllAmount: !!intent.useAllAmount,
        },
      });
      estimatedFees = estimation.estimatedFees;
      estimatedAmount = estimation.amount;

      // Handle Taquito errors
      if (estimation.taquitoError) {
        const taquitoErrors = mapTaquitoErrors(estimation.taquitoError, intent.type);
        Object.assign(errors, taquitoErrors);
      }
    } else {
      estimatedFees = 2000n;
    }

    // Calculate final amounts
    const amounts = calculateAmounts(intent, senderInfo, estimatedFees, estimatedAmount);
    amount = amounts.amount;
    totalSpent = amounts.totalSpent;

    // Final balance validation
    const balanceErrors = validateBalanceCoverage(senderInfo, totalSpent);
    Object.assign(errors, balanceErrors);
  } catch (e) {
    errors.estimation = e as Error;
    estimatedFees = 0n;
    amount = intent.amount;
    totalSpent = intent.amount;
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}
