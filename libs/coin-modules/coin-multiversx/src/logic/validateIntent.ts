import type {
  TransactionIntent,
  TransactionValidation,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
  AssetInfo,
} from "@ledgerhq/coin-framework/api/types";
import { isValidAddress } from "../logic";

/**
 * Type guard to check if an asset is an ESDT asset with assetReference.
 */
function isEsdtAsset(asset: AssetInfo): asset is { type: "esdt"; assetReference: string } {
  return asset.type === "esdt" && "assetReference" in asset && typeof asset.assetReference === "string";
}

/**
 * Validates a transaction intent against account balances.
 *
 * @param intent - The transaction intent to validate
 * @param balances - Current account balances (from getBalance)
 * @param customFees - Optional fee estimation (from estimateFees)
 * @returns TransactionValidation with errors, warnings, and calculated amounts
 */
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  // Validate balances array is not empty
  if (!balances || balances.length === 0) {
    errors.balances = new Error("Balances array cannot be empty");
    return {
      errors,
      warnings,
      estimatedFees: customFees?.value ?? 0n,
      amount: intent.amount,
      totalSpent: intent.amount + (customFees?.value ?? 0n),
    };
  }

  // Validate sender address
  if (!intent.sender || !isValidAddress(intent.sender)) {
    errors.sender = new Error("Invalid sender address");
  }

  // Validate recipient address
  if (!intent.recipient || !isValidAddress(intent.recipient)) {
    errors.recipient = new Error("Invalid recipient address");
  }

  // Validate amount
  if (intent.amount <= 0n && !intent.useAllAmount) {
    errors.amount = new Error("Amount must be greater than 0");
  }

  // Extract and validate native balance (should be exactly one)
  const nativeBalances = balances.filter(b => b.asset.type === "native");
  if (nativeBalances.length === 0) {
    errors.balances = new Error("Native balance not found in balances array");
    return {
      errors,
      warnings,
      estimatedFees: customFees?.value ?? 0n,
      amount: intent.amount,
      totalSpent: intent.amount + (customFees?.value ?? 0n),
    };
  }
  if (nativeBalances.length > 1) {
    errors.balances = new Error("Multiple native balances found (invalid state)");
  }
  const nativeBalance = nativeBalances[0]?.value ?? 0n;

  // Validate native balance is non-negative
  if (nativeBalance < 0n) {
    errors.balances = new Error("Invalid native balance: negative value");
  }

  const fees = customFees?.value ?? 0n;

  // Calculate amount (handle useAllAmount if needed)
  let amount = intent.amount;
  if (intent.useAllAmount) {
    if (intent.asset.type === "native") {
      const spendable = nativeBalance - fees;
      amount = spendable > 0n ? spendable : 0n;
    } else {
      // For ESDT, find token balance using type guard
      const esdtAssetRef = isEsdtAsset(intent.asset) ? intent.asset.assetReference : undefined;
      const tokenBalance = esdtAssetRef
        ? balances.find(
            b => b.asset.type === "esdt" && isEsdtAsset(b.asset) && b.asset.assetReference === esdtAssetRef,
          )
        : undefined;
      amount = tokenBalance?.value ?? 0n;
    }
  }

  // Validate based on asset type
  if (intent.asset.type === "native") {
    // Native EGLD transfer
    const totalSpent = amount + fees;

    if (!errors.amount && totalSpent > nativeBalance) {
      errors.amount = new Error("Insufficient balance");
    }

    return {
      errors,
      warnings,
      estimatedFees: fees,
      amount,
      totalSpent,
    };
  } else {
    // ESDT token transfer
    const esdtAssetRef = isEsdtAsset(intent.asset) ? intent.asset.assetReference : undefined;
    const tokenBalance = esdtAssetRef
      ? balances.find(
          b => b.asset.type === "esdt" && isEsdtAsset(b.asset) && b.asset.assetReference === esdtAssetRef,
        )
      : undefined;

    if (!tokenBalance) {
      errors.amount = new Error("Token not found in account");
    } else if (!errors.amount && amount > tokenBalance.value) {
      errors.amount = new Error("Insufficient token balance");
    }

    // Fees come from native balance - use separate error key to avoid overwriting
    if (fees > nativeBalance) {
      errors.fees = new Error("Insufficient balance for fees");
    }

    const totalSpent = amount; // Fees paid separately

    return {
      errors,
      warnings,
      estimatedFees: fees,
      amount,
      totalSpent,
    };
  }
}
