import {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  FeeTooHigh,
  InvalidAddress,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { isValidAddress } from "algosdk";
import type { AlgorandContext } from "../config";
import { AlgorandASANotOptInInRecipient, AlgorandMemoExceededSizeError } from "../errors";
import { getAccount } from "../network";
import type { AlgorandMemo } from "../types";
import { ALGORAND_MIN_ACCOUNT_BALANCE, computeMinimumBalance, hasAssetReference } from "./common";
import { validateMemo } from "./validateMemo";

const OPT_IN_RESERVE = computeMinimumBalance(0, true) - computeMinimumBalance(0);

function validateOptIn(
  intent: TransactionIntent<AlgorandMemo>,
  balances: Balance[],
  fees: bigint,
  errors: Record<string, Error>,
): TransactionValidation {
  if (!hasAssetReference(intent.asset)) {
    // Not translated: it only blocks the flow until the user picks an asset
    errors.assetId = new Error("Asset Id is not set");
  }

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const spendable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  if (spendable - OPT_IN_RESERVE < fees) {
    errors.amount = new NotEnoughBalance();
  }

  return { errors, warnings: {}, estimatedFees: fees, amount: 0n, totalSpent: fees };
}

/**
 * Validate a transaction intent for Algorand
 * @param intent - The transaction intent
 * @param balances - Current account balances
 * @param customFees - Optional custom fees
 * @returns Validation result with errors, warnings, and amounts
 */
export async function validateIntent(
  context: AlgorandContext,
  intent: TransactionIntent<AlgorandMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const fees = customFees?.value ?? 0n;
  let amount = intent.amount;

  const memoValue = intent.memo?.type === "string" ? intent.memo.value : undefined;
  if (memoValue && !validateMemo(memoValue)) {
    errors.transaction = new AlgorandMemoExceededSizeError();
  }

  if (intent.type === "changeTrust") {
    return validateOptIn(intent, balances, fees, errors);
  }

  // Validate recipient
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress();
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  // Get native balance
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const balance = nativeBalance?.value ?? 0n;
  const locked = nativeBalance?.locked ?? 0n;

  // Check for token transfer
  const assetReference = hasAssetReference(intent.asset) ? intent.asset.assetReference : undefined;
  const isTokenTransfer = assetReference !== undefined;
  let tokenBalance: Balance | undefined;

  if (isTokenTransfer) {
    tokenBalance = balances.find(
      b => hasAssetReference(b.asset) && b.asset.assetReference === assetReference,
    );

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
    if (intent.useAllAmount && amount === 0n) {
      errors.amount = new NotEnoughBalance();
    } else if (isTokenTransfer) {
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
      const config = await context.config();
      const recipientAccount = await getAccount(config, intent.recipient);

      if (isTokenTransfer) {
        // Check if recipient has opted in to the ASA token
        const hasOptedIn = recipientAccount.assets.map(a => a.assetId).includes(assetReference);
        if (!hasOptedIn) {
          errors.recipient = new AlgorandASANotOptInInRecipient();
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

  if (!isTokenTransfer && amount > 0n && fees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount,
    totalSpent,
  };
}
