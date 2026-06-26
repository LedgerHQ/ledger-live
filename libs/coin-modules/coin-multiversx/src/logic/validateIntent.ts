import type {
  TransactionIntent,
  TransactionValidation,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
  AssetInfo,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  MultiversXStakingRecipientNotValidator,
  MultiversXTokenIdentifierRequired,
  MultiversXUnsupportedAssetType,
  MultiversXUnsupportedStakingType,
  NotEnoughEGLDForFees,
} from "../errors";
import { isValidAddress } from "../logic";
import { isStakingIntent, isSupportedStakingType, isValidatorContract } from "./craftTransaction";

const CURRENCY_NAME = "MultiversX";

/**
 * Type guard to check if an asset is an ESDT asset with assetReference.
 */
function isEsdtAsset(asset: AssetInfo): asset is { type: "esdt"; assetReference: string } {
  return (
    asset.type === "esdt" && "assetReference" in asset && typeof asset.assetReference === "string"
  );
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

  if (isStakingIntent(intent)) {
    return validateStakingIntent(intent, balances, customFees);
  }

  if (!intent.sender || !isValidAddress(intent.sender)) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }

  if (intent.asset.type !== "native" && intent.asset.type !== "esdt") {
    errors.asset = new MultiversXUnsupportedAssetType(intent.asset.type);
  } else if (intent.asset.type === "esdt") {
    const assetReference =
      "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
    if (!assetReference || assetReference.length === 0) {
      errors.asset = new MultiversXTokenIdentifierRequired();
    }
  }

  // Validate amount
  if (intent.amount <= 0n && !intent.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  // Native balance drives fee coverage; default to 0 when absent (matching the
  // findBalance-defaulting used by evm/solana/stellar) so an empty or partial
  // balances array surfaces as NotEnoughBalance rather than an internal error.
  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;

  const fees = customFees?.value ?? 0n;

  let amount = intent.amount;
  if (intent.useAllAmount) {
    if (intent.asset.type === "native") {
      const spendable = nativeBalance - fees;
      amount = spendable > 0n ? spendable : 0n;
    } else {
      const esdtAssetRef = isEsdtAsset(intent.asset) ? intent.asset.assetReference : undefined;
      const tokenBalance = esdtAssetRef
        ? balances.find(
            b =>
              b.asset.type === "esdt" &&
              isEsdtAsset(b.asset) &&
              b.asset.assetReference === esdtAssetRef,
          )
        : undefined;
      amount = tokenBalance?.value ?? 0n;
    }
  }

  if (intent.asset.type === "native") {
    const totalSpent = amount + fees;
    if (!errors.amount && totalSpent > nativeBalance) {
      errors.amount = new NotEnoughBalance();
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
          b =>
            b.asset.type === "esdt" &&
            isEsdtAsset(b.asset) &&
            b.asset.assetReference === esdtAssetRef,
        )
      : undefined;

    if (!tokenBalance) {
      if (!errors.amount) {
        errors.amount = new NotEnoughBalance();
      }
    } else if (!errors.amount && amount > tokenBalance.value) {
      errors.amount = new NotEnoughBalance();
    }

    // ESDT fees are paid in native EGLD - use a separate key so a token-balance
    // error is not overwritten, and the dedicated MultiversX class per the bridge.
    if (fees > nativeBalance) {
      errors.fees = new NotEnoughEGLDForFees();
    }

    const totalSpent = amount;

    return {
      errors,
      warnings,
      estimatedFees: fees,
      amount,
      totalSpent,
    };
  }
}

/**
 * Validates a staking (delegation) transaction intent.
 *
 * Staking intents must use the native asset, target a delegation/validator
 * contract, and reference a supported staking operation. Only "delegate" spends
 * an amount from the balance; the other operations (undelegate, claimRewards,
 * withdraw, reDelegateRewards) only pay network fees.
 *
 * @param intent - The staking transaction intent to validate
 * @param balances - Current account balances (from getBalance)
 * @param customFees - Optional fee estimation (from estimateFees)
 * @returns TransactionValidation with errors, warnings, and calculated amounts
 */
function validateStakingIntent(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const fees = customFees?.value ?? 0n;

  if (!intent.sender || !isValidAddress(intent.sender)) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }

  if (intent.asset.type !== "native") {
    errors.asset = new MultiversXUnsupportedAssetType(intent.asset.type);
  }

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  } else if (!isValidatorContract(intent.recipient)) {
    errors.recipient = new MultiversXStakingRecipientNotValidator();
  }

  if (!isSupportedStakingType(intent.type)) {
    errors.type = new MultiversXUnsupportedStakingType(intent.type);
  }

  const nativeBalances = balances.filter(b => b.asset.type === "native");
  const nativeBalance = nativeBalances[0]?.value ?? 0n;

  const spendsAmount = intent.type === "delegate";
  let amount = 0n;
  if (spendsAmount) {
    if (intent.useAllAmount) {
      const spendable = nativeBalance - fees;
      amount = spendable > 0n ? spendable : 0n;
    } else {
      amount = intent.amount;
    }
  }
  const totalSpent = amount + fees;

  if (spendsAmount && intent.amount <= 0n && !intent.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (!errors.asset && !errors.recipient && totalSpent > nativeBalance) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount,
    totalSpent,
  };
}
