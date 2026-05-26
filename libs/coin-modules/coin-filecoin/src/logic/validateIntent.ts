import type {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
  Balance,
  AssetInfo,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
  FeeTooHigh,
} from "@ledgerhq/errors";
import { validateAddress } from "../network";

export async function validateIntent(
  intent: TransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = intent.asset.type !== "native";

  // Validate recipient
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!validateAddress(intent.recipient).isValid) {
    errors.recipient = new InvalidAddress("", { currencyName: "Filecoin" });
  }

  // Compute amount
  const amount = computeAmount(intent, balances, estimatedFees, isTokenTransfer);

  // Validate amount
  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (isTokenTransfer) {
    if (amount > findBalance(intent.asset, balances).value) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    const nativeBalance = balances.find(b => b.asset.type === "native");
    const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
    if (amount + estimatedFees > available) {
      errors.amount = new NotEnoughBalance();
    }
  }

  // Warn if fees are disproportionately high
  if (amount > 0n && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

function computeAmount(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
): bigint {
  if (!intent.useAllAmount) {
    return intent.amount;
  }

  if (isTokenTransfer) {
    return findBalance(intent.asset, balances).value;
  }

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
  const maxAmount = available - estimatedFees;
  return maxAmount > 0n ? maxAmount : 0n;
}

function findBalance(asset: AssetInfo, balances: Balance[]): Balance {
  if (asset.type === "native") {
    return balances.find(b => b.asset.type === "native") ?? { asset, value: 0n };
  }
  if ("assetReference" in asset) {
    return (
      balances.find(
        b => "assetReference" in b.asset && b.asset.assetReference === asset.assetReference,
      ) ?? { asset, value: 0n }
    );
  }
  return { asset, value: 0n };
}
