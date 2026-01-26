import {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/types";
import {
  InvalidAddress,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import { AlgorandASANotOptInInRecipient, AlgorandMemoExceededSizeError } from "../errors";
import { getAccount } from "../network";
import type { AlgorandMemo } from "../types";
import { ALGORAND_MIN_ACCOUNT_BALANCE } from "./common";
import { validateAddress } from "./validateAddress";
import { validateMemo } from "./validateMemo";

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
    errors.recipient = new RecipientRequired();
  } else if (!validateAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress();
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
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
      errors.amount = new NotEnoughBalance();
    }
  }

  // Validate amount
  if (amount <= 0n && !intent.useAllAmount) {
    errors.amount = new AmountRequired();
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
        errors.amount = new NotEnoughBalance();
      }
      // Check native balance for fees
      if (fees > balance - locked) {
        errors.amount = new NotEnoughBalanceInParentAccount();
      }
    } else {
      // Check native balance
      const spendable = balance - locked;
      if (totalSpent > spendable) {
        errors.amount = new NotEnoughBalance();
      }
    }
  }

  // Validate recipient account (fetch once for both ASA opt-in and native minimum balance checks)
  if (!errors.recipient && intent.recipient) {
    try {
      const recipientAccount = await getAccount(intent.recipient);

      if (isTokenTransfer) {
        // Check if recipient has opted in to the ASA token
        const intentAssetRef = (intent.asset as { assetReference?: string }).assetReference;
        if (intentAssetRef) {
          const hasOptedIn = recipientAccount.assets.map(a => a.assetId).includes(intentAssetRef);
          if (!hasOptedIn) {
            errors.recipient = new AlgorandASANotOptInInRecipient();
          }
        }
      } else if (amount > 0n) {
        // Check minimum balance requirement for native transfers
        const recipientBalance = BigInt(recipientAccount.balance.toString());
        if (recipientBalance === 0n && amount < ALGORAND_MIN_ACCOUNT_BALANCE) {
          errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
            minimalAmount: "0.1 ALGO",
          });
        }
      }
    } catch {
      // Handle account fetch error
      if (isTokenTransfer) {
        // If we can't fetch the account, assume it doesn't exist and hasn't opted in
        errors.recipient = new AlgorandASANotOptInInRecipient();
      } else if (amount > 0n) {
        // Account doesn't exist yet, need minimum balance for native transfer
        if (amount < ALGORAND_MIN_ACCOUNT_BALANCE) {
          errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
            minimalAmount: "0.1 ALGO",
          });
        }
      }
    }
  }

  // Validate memo
  const memoValue = intent.memo?.type === "string" ? intent.memo.value : undefined;
  if (memoValue && !validateMemo(memoValue)) {
    errors.transaction = new AlgorandMemoExceededSizeError();
  }

  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount,
    totalSpent,
  };
}
