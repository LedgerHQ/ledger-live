import type {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
  Balance,
  AssetInfo,
  MemoNotSupported,
  StringMemo,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import { isValidBase58Address, isSolanaStakingTransactionIntent } from "../logic";
import { getAtaDataLengthForMint } from "../helpers/token";
import { ChainAPI } from "../network";
import { getMaybeTokenMint } from "../network/chain/web3";
import type { SolanaTokenProgram } from "../types";

export async function validateIntent(
  transactionIntent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
  api?: ChainAPI,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = transactionIntent.asset.type !== "native";

  if (isSolanaStakingTransactionIntent(transactionIntent)) {
    return validateStakingIntent(transactionIntent, balances, estimatedFees);
  }

  validateRecipient(transactionIntent, errors);
  const amount = computeAmount(transactionIntent, balances, estimatedFees, isTokenTransfer);
  validateAmount(transactionIntent, amount, balances, estimatedFees, isTokenTransfer, errors);

  if (isTokenTransfer && api && transactionIntent.recipient && !errors.recipient) {
    await validateTokenTransferNativeCoverage(
      api,
      transactionIntent,
      balances,
      estimatedFees,
      errors,
    );
  }

  checkFeeTooHigh(amount, estimatedFees, warnings);

  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

/**
 * SPL token transfers require enough native SOL to cover the network fee and,
 * when the recipient has no associated token account, its mint-aware rent. The
 * mint-aware size matters for Token-2022 mints with extensions, whose ATA is
 * larger than the classic 165-byte one and rents more SOL on-chain. If we miss
 * this check, prepareTransaction is happy off-chain but the broadcast fails.
 */
async function validateTokenTransferNativeCoverage(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
): Promise<void> {
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!mintAddress) return;

  const mintOrError = await getMaybeTokenMint(mintAddress, api);
  if (!mintOrError || mintOrError instanceof Error) return;

  const tokenProgram = mintOrError.onChainAcc.data.program as SolanaTokenProgram;
  const recipientAta = await api.findAssocTokenAccAddress(
    intent.recipient,
    mintAddress,
    tokenProgram,
  );
  const ataExists = (await api.getBalance(recipientAta)) > 0;
  const ataRent = ataExists
    ? 0n
    : BigInt(await api.getMinimumBalanceForRentExemption(getAtaDataLengthForMint(mintOrError)));

  const requiredSol = ataRent + estimatedFees;
  const native = balances.find(b => b.asset.type === "native");
  const spendable = (native?.value ?? 0n) - (native?.locked ?? 0n);

  if (spendable < requiredSol || spendable === 0n) {
    errors.gasPrice = new NotEnoughGas(undefined, {
      fees: requiredSol.toString(),
    });
  }
}

function validateStakingIntent(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
): TransactionValidation {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  validateStakingRecipient(intent, errors);

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
  const nativeValue = nativeBalance?.value ?? 0n;

  let amount: bigint;
  let totalSpent: bigint;

  switch (intent.type) {
    case "stake.createAccount":
      amount = computeCreateAccountAmount(intent, available, estimatedFees, errors);
      totalSpent = amount + estimatedFees;
      break;
    case "stake.delegate":
      amount = 0n;
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, available, errors);
      break;
    case "stake.undelegate":
      amount = 0n;
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, nativeValue, errors);
      break;
    case "stake.withdraw":
      amount = clampPositive(intent.amount);
      totalSpent = estimatedFees;
      validateFeeCoverage(estimatedFees, nativeValue, errors);
      break;
    default:
      amount = intent.amount;
      totalSpent = estimatedFees;
      break;
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

function validateStakingRecipient(intent: TransactionIntent, errors: Record<string, Error>): void {
  if (intent.recipient && !isValidBase58Address(intent.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: intent.asset?.name ?? "Solana",
    });
  }
}

function computeCreateAccountAmount(
  intent: TransactionIntent,
  available: bigint,
  estimatedFees: bigint,
  errors: Record<string, Error>,
): bigint {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  }
  if (intent.useAllAmount) {
    return clampPositive(available - estimatedFees);
  }
  if (intent.amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (intent.amount + estimatedFees > available) {
    errors.amount = new NotEnoughBalance();
  }
  return intent.amount;
}

function validateFeeCoverage(
  estimatedFees: bigint,
  balance: bigint,
  errors: Record<string, Error>,
): void {
  if (estimatedFees > balance) {
    errors.amount = new NotEnoughBalance();
  }
}

function clampPositive(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

function validateRecipient(intent: TransactionIntent, errors: Record<string, Error>): void {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidBase58Address(intent.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: intent.asset?.name ?? "Solana",
    });
  }
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

function validateAmount(
  intent: TransactionIntent,
  amount: bigint,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
  errors: Record<string, Error>,
): void {
  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
    return;
  }

  if (isTokenTransfer) {
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
}

function checkFeeTooHigh(
  amount: bigint,
  estimatedFees: bigint,
  warnings: Record<string, Error>,
): void {
  if (amount > 0n && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }
}

function assetsAreEqual(asset1: AssetInfo, asset2: AssetInfo): boolean {
  if (asset1.type === "native" && asset2.type === "native") return true;
  if ("assetReference" in asset1 && "assetReference" in asset2) {
    return asset1.assetReference === asset2.assetReference;
  }
  return false;
}

function findBalance(asset: AssetInfo, balances: Balance[]): Balance {
  return balances.find(b => assetsAreEqual(b.asset, asset)) ?? { asset, value: 0n };
}
