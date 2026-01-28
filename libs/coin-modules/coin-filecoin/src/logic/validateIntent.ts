import { validateAddress } from "./validateAddress";
import { isRecipientValidForTokenTransfer } from "../network/addresses";
import type {
  TransactionIntent,
  TransactionValidation,
  Balance,
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/index";
import type { FilecoinFeeEstimation } from "../types/model";

/**
 * Validate a transaction intent before crafting/broadcasting.
 *
 * Note: useAllAmount is NOT handled in API layer - only in bridge
 *
 * @param intent - The transaction intent to validate
 * @param balances - Current account balances
 * @param customFees - Optional custom fee estimation
 * @returns Validation result with errors, warnings, and amounts
 */
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported>,
  balances: Balance[],
  customFees?: FilecoinFeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  // Validate sender address
  if (!intent.sender || !validateAddress(intent.sender)) {
    errors.sender = new Error("Invalid sender address");
  }

  // Validate recipient address
  if (!intent.recipient || !validateAddress(intent.recipient)) {
    errors.recipient = new Error("Invalid recipient address");
  }

  // Validate amount (must be > 0)
  // Note: useAllAmount handling is done in bridge, not API
  if (intent.amount <= 0n) {
    errors.amount = new Error("Amount must be greater than 0");
  }

  // Get native balance
  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;
  const fees = customFees?.value ?? 0n;

  // Validate balance for native transfers
  if (intent.asset.type === "native") {
    const totalSpent = intent.amount + fees;
    if (totalSpent > nativeBalance) {
      errors.amount = new Error("Insufficient balance");
    }
  }

  // Token transfer recipient validation
  if (intent.asset.type === "erc20") {
    if (!isRecipientValidForTokenTransfer(intent.recipient)) {
      errors.recipient = new Error(
        "Invalid recipient for token transfer. Must be an Ethereum-compatible address.",
      );
    }

    // For token transfers, check native balance covers fees
    if (fees > nativeBalance) {
      errors.amount = new Error("Insufficient FIL balance for transaction fees");
    }

    // Check token balance
    const intentAssetReference =
      intent.asset.type === "erc20" ? intent.asset.assetReference : undefined;
    const tokenBalance =
      balances.find(
        b =>
          b.asset.type === "erc20" &&
          b.asset.assetReference?.toLowerCase() === intentAssetReference?.toLowerCase(),
      )?.value ?? 0n;

    if (intent.amount > tokenBalance) {
      errors.amount = new Error("Insufficient token balance");
    }
  }

  const totalSpent = intent.asset.type === "native" ? intent.amount + fees : fees;

  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount: intent.amount,
    totalSpent,
  };
}
