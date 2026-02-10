import {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/types";
import { validateAddress } from "./validateAddress";
import { validateMemo } from "./validateMemo";
import { ALGORAND_MIN_ACCOUNT_BALANCE } from "./common";
import { getAccount } from "../network";
import type { AlgorandMemo } from "../types";

/**
 * Validate a transaction intent for Algorand
 * @param intent - The transaction intent
 * @param balances - Current account balances
 * @param customFees - Optional custom fees
 * @returns Validation result with errors, warnings, and amounts
 */
export async function validateIntent(
  intent: TransactionIntent<AlgorandMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const fees = customFees?.value ?? 0n;
  let amount = intent.amount;

  // Validate recipient
  if (!intent.recipient) {
    errors.recipient = new Error("Recipient is required");
  } else if (!validateAddress(intent.recipient)) {
    errors.recipient = new Error("Invalid recipient address");
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new Error("Sender and recipient cannot be the same");
  }

  // Get native balance
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const balance = nativeBalance?.value ?? 0n;
  const locked = nativeBalance?.locked ?? 0n;

  // Check for token transfer
  const isTokenTransfer = intent.asset.type !== "native";
  let tokenBalance: Balance | undefined;

  if (isTokenTransfer) {
    const intentAssetRef = (intent.asset as { assetReference?: string }).assetReference;
    tokenBalance = balances.find(b => {
      if (b.asset.type !== "asa") return false;
      const balanceAssetRef = (b.asset as { assetReference?: string }).assetReference;
      return balanceAssetRef === intentAssetRef;
    });

    if (!tokenBalance) {
      errors.amount = new Error("Token not found in account");
    }
  }

  // Validate amount
  if (amount <= 0n && !intent.useAllAmount) {
    errors.amount = new Error("Amount must be greater than 0");
  }

  // Handle useAllAmount
  if (intent.useAllAmount) {
    if (isTokenTransfer && tokenBalance) {
      amount = tokenBalance.value;
    } else {
      const spendable = balance - locked - fees;
      amount = spendable > 0n ? spendable : 0n;
    }
  }

  // Calculate total spent
  const totalSpent = isTokenTransfer ? amount : amount + fees;

  // Check balance
  if (!errors.amount) {
    if (isTokenTransfer) {
      // Check token balance
      if (tokenBalance && amount > tokenBalance.value) {
        errors.amount = new Error("Insufficient token balance");
      }
      // Check native balance for fees
      if (fees > balance - locked) {
        errors.amount = new Error("Insufficient balance for fees");
      }
    } else {
      // Check native balance
      const spendable = balance - locked;
      if (totalSpent > spendable) {
        errors.amount = new Error("Insufficient balance");
      }
    }
  }

  // Validate recipient account for native transfers
  if (!errors.recipient && !isTokenTransfer && amount > 0n) {
    try {
      const recipientAccount = await getAccount(intent.recipient);
      const recipientBalance = BigInt(recipientAccount.balance.toString());

      // New accounts must receive at least minimum balance
      if (recipientBalance === 0n && amount < ALGORAND_MIN_ACCOUNT_BALANCE) {
        errors.amount = new Error(
          `Recipient is a new account and must receive at least ${ALGORAND_MIN_ACCOUNT_BALANCE} microAlgos (0.1 ALGO)`,
        );
      }
    } catch {
      // Account doesn't exist yet, need minimum balance
      if (amount < ALGORAND_MIN_ACCOUNT_BALANCE) {
        errors.amount = new Error(
          `Recipient is a new account and must receive at least ${ALGORAND_MIN_ACCOUNT_BALANCE} microAlgos (0.1 ALGO)`,
        );
      }
    }
  }

  // Validate memo
  const memoValue = intent.memo?.type === "string" ? intent.memo.value : undefined;
  if (memoValue && !validateMemo(memoValue)) {
    errors.memo = new Error("Memo exceeds maximum size");
  }

  // Fee warning
  if (!isTokenTransfer && amount > 0n && fees * 10n > amount) {
    warnings.fees = new Error("Fees are high relative to amount");
  }

  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount,
    totalSpent,
  };
}
