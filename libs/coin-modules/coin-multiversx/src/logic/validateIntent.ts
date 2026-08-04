import type {
  Balance,
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { isValidAddress } from "./validateAddress";
import { estimateFees } from "./transaction/estimateFees";
import { NotEnoughEGLDForFees } from "../errors";
import { MIN_DELEGATION_AMOUNT } from "../constants";

function findNativeBalance(balances: Balance[]): bigint {
  const b = balances.find(b => b.asset.type === "native");
  return b ? b.value - (b.locked ?? 0n) : 0n;
}

function findEsdtBalance(balances: Balance[], assetReference: string): bigint {
  const b = balances.find(
    b =>
      b.asset.type === "esdt" &&
      "assetReference" in b.asset &&
      b.asset.assetReference === assetReference,
  );
  return b ? b.value : 0n;
}

const STAKING_TYPES = new Set([
  "delegate",
  "reDelegateRewards",
  "unDelegate",
  "claimRewards",
  "withdraw",
  "stake.createAccount",
  "stake.undelegate",
  "stake.withdraw",
]);

const MIN_DELEGATION = BigInt(MIN_DELEGATION_AMOUNT.toFixed(0));

/** ESDT asset reference if this intent is a token transfer, else undefined. */
function getEsdtReference(
  intent: TransactionIntent | StakingTransactionIntent,
): string | undefined {
  const asset = intent.asset;
  if (asset.type === "esdt" && "assetReference" in asset && asset.assetReference) {
    return asset.assetReference;
  }
  return undefined;
}

/** Recipient rule — not required for claimRewards/reDelegateRewards/withdraw. */
function validateRecipient(
  intent: TransactionIntent | StakingTransactionIntent,
  txType: string,
  assetType: string,
  isClaimRewards: boolean,
  isStaking: boolean,
): Error | undefined {
  const recipientRequired =
    !isClaimRewards &&
    txType !== "reDelegateRewards" &&
    txType !== "withdraw" &&
    txType !== "stake.withdraw";
  if (!recipientRequired) return undefined;

  if (!intent.recipient) return new RecipientRequired();
  if (intent.sender === intent.recipient && assetType === "native" && !isStaking) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }
  if (!isValidAddress(intent.recipient)) {
    return new InvalidAddress("", { currencyName: "MultiversX" });
  }
  return undefined;
}

/** ESDT transfer: token amount vs token balance, fees vs native spendable. */
function validateEsdtSpend(
  amount: bigint,
  esdtAvailable: bigint,
  estimatedFees: bigint,
  nativeSpendable: bigint,
  isClaimRewards: boolean,
): { errors: Record<string, Error>; totalSpent: bigint } {
  const errors: Record<string, Error> = {};
  if (!isClaimRewards && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (amount > esdtAvailable) {
    errors.amount = new NotEnoughBalance();
  }
  if (estimatedFees > nativeSpendable) {
    // Token amount is covered but there isn't enough native EGLD for fees — use the
    // dedicated error the UI/i18n expects (matches the legacy bridge getTransactionStatus).
    errors.gasPrice = new NotEnoughEGLDForFees();
  }
  return { errors, totalSpent: estimatedFees };
}

/** Native EGLD transfer or staking op: amount rules + native spendable check. */
function validateNativeSpend(
  amount: bigint,
  txType: string,
  assetType: string,
  estimatedFees: bigint,
  nativeSpendable: bigint,
  isClaimRewards: boolean,
  isStaking: boolean,
): { errors: Record<string, Error>; totalSpent: bigint } {
  const errors: Record<string, Error> = {};
  const isDelegate = txType === "delegate" || txType === "stake.createAccount";
  const isUndelegate = txType === "unDelegate" || txType === "stake.undelegate";

  if (!isClaimRewards && !isStaking && amount <= 0n) {
    errors.amount = new AmountRequired();
  }
  if ((isDelegate || isUndelegate) && amount < MIN_DELEGATION) {
    errors.amount = new AmountRequired();
  }

  // delegate / stake.createAccount move `amount` EGLD to the staking contract,
  // so they consume amount + fees. unDelegate / claimRewards / reDelegate /
  // withdraw carry value 0 and only consume fees.
  const consumesNativeAmount = (assetType === "native" && !isStaking) || isDelegate;
  const spends = consumesNativeAmount ? amount + estimatedFees : estimatedFees;
  if (!errors.amount && spends > nativeSpendable) {
    errors.amount = new NotEnoughBalance();
  }
  return { errors, totalSpent: spends };
}

/**
 * Validate a MultiversX transaction intent.
 *
 * Rules:
 * - recipient required and valid for send/delegate
 * - amount > 0 for send and ESDT transfers (claimRewards amount may be 0)
 * - for native: amount + fees <= spendable
 * - for ESDT: token amount <= esdt balance AND fees (native) <= native spendable
 * - for staking delegate/unDelegate: amount >= MIN_DELEGATION_AMOUNT (1 EGLD)
 * - claimRewards with amount 0 is valid
 */
export async function validateIntent(
  intent: TransactionIntent | StakingTransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const warnings: Record<string, Error> = {};

  const txType = (intent as StakingTransactionIntent).type ?? "";
  const assetType = intent.asset.type;
  const isClaimRewards = txType === "claimRewards";
  const isStaking = STAKING_TYPES.has(txType);

  // Use the provided fee when present, otherwise estimate it — the balance checks
  // (and native send-max below) need a real fee, not 0.
  const providedFees = customFees?.value;
  const estimatedFees =
    providedFees !== undefined && providedFees > 0n
      ? providedFees
      : (await estimateFees(intent, customFees?.parameters)).value;

  const errors: Record<string, Error> = {};
  const recipientError = validateRecipient(intent, txType, assetType, isClaimRewards, isStaking);
  if (recipientError) errors.recipient = recipientError;

  const nativeSpendable = findNativeBalance(balances);
  const esdtReference = getEsdtReference(intent);
  const useAllAmount = (intent as TransactionIntent).useAllAmount === true;

  // Effective amount — send-max resolves to the full token balance (ESDT) or the
  // native spendable minus fees. The resolved amount is returned so callers craft
  // with it.
  let amount = intent.amount;
  let spend: { errors: Record<string, Error>; totalSpent: bigint };

  if (esdtReference) {
    const esdtAvailable = findEsdtBalance(balances, esdtReference);
    if (useAllAmount) amount = esdtAvailable;
    spend = validateEsdtSpend(
      amount,
      esdtAvailable,
      estimatedFees,
      nativeSpendable,
      isClaimRewards,
    );
  } else {
    if (useAllAmount && assetType === "native" && !isStaking) {
      amount = nativeSpendable > estimatedFees ? nativeSpendable - estimatedFees : 0n;
    }
    spend = validateNativeSpend(
      amount,
      txType,
      assetType,
      estimatedFees,
      nativeSpendable,
      isClaimRewards,
      isStaking,
    );
  }
  Object.assign(errors, spend.errors);

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent: spend.totalSpent,
  };
}
