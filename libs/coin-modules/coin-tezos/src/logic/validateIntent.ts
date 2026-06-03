import type {
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
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
import type { APIAccount } from "../network/types";
import { InvalidAddressBecauseAlreadyDelegated, MustDelegateBeforeStaking } from "../types/errors";
import { computeMaxStakeAmount, parseTezosTokenAsset, resolveTezosOperationMode } from "../utils";
import { estimateFees } from "./estimateFees";
import type { TezosOperationMode } from "../types/model";

type APIUserAccount = Extract<APIAccount, { type: "user" }>;

function resolveValidationOperationMode(intent: TransactionIntent): TezosOperationMode {
  switch (intent.type) {
    case "stake":
    case "unstake":
    case "finalize_unstake":
      return intent.type;
    default:
      return resolveTezosOperationMode(intent.type, intent.asset);
  }
}

function validateStrictlyPositiveAmount(amount: bigint): Error | undefined {
  if (amount === 0n) {
    return new AmountRequired();
  }

  if (amount < 0n) {
    return new NotEnoughBalance();
  }

  return undefined;
}

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

// send max not allowed on delegated accounts (must undelegate acc first); native XTZ only
function validateSendConstraints(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
): Record<string, Error> {
  if (
    intent.useAllAmount &&
    resolveValidationOperationMode(intent) === "send" &&
    senderInfo.delegate?.address
  ) {
    return { amount: new RecommendUndelegation() };
  }
  return {};
}

function validateStakeConstraints(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
): Record<string, Error> {
  if (!senderInfo.delegate?.address) {
    return { amount: new MustDelegateBeforeStaking() };
  }
  if (intent.useAllAmount) {
    return {};
  }
  const amountError = validateStrictlyPositiveAmount(intent.amount);
  return amountError ? { amount: amountError } : {};
}

function validateUnstakeConstraints(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
): Record<string, Error> {
  const stakedBalance = BigInt(senderInfo.stakedBalance ?? 0);
  if (stakedBalance <= 0n) {
    return { amount: new NotEnoughBalance() };
  }
  if (intent.useAllAmount) {
    return {};
  }
  const amountError = validateStrictlyPositiveAmount(intent.amount);
  if (amountError) {
    return { amount: amountError };
  }
  if (intent.amount > stakedBalance) {
    return { amount: new NotEnoughBalance() };
  }
  return {};
}

function validateFinalizeUnstakeConstraints(finalizable: bigint): Record<string, Error> {
  return finalizable <= 0n ? { amount: new NotEnoughBalance() } : {};
}

function validateTransactionConstraints(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
  finalizable: bigint,
): Record<string, Error> {
  switch (intent.type) {
    case "send":
      return validateSendConstraints(intent, senderInfo);
    case "stake":
      return validateStakeConstraints(intent, senderInfo);
    case "unstake":
      return validateUnstakeConstraints(intent, senderInfo);
    case "finalize_unstake":
      return validateFinalizeUnstakeConstraints(finalizable);
    default:
      return {};
  }
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
  } else if (taquitoError.endsWith("staking.too_much_unstaked")) {
    errors.amount = new NotEnoughBalance();
  } else if (taquitoError.endsWith("contract.must_be_delegated_to_stake")) {
    errors.amount = new MustDelegateBeforeStaking();
  } else if (taquitoError.endsWith("delegate.unchanged")) {
    // Re-delegating (or staking) to the current baker leaves the delegate unchanged; the node
    // rejects it. Surfaces for both `delegate` and `stake` intents as "already delegated".
    errors.recipient = new InvalidAddressBecauseAlreadyDelegated();
  } else if (taquitoError.includes("empty_implicit_contract")) {
    errors.amount = new NotEnoughBalanceToDelegate();
  } else if (taquitoError.includes("script_rejected")) {
    errors.amount = new NotEnoughBalance();
  } else {
    errors.amount = new Error(taquitoError);
  }

  return errors;
}

function calculateNativeSendMaxAmountForUser(
  balance: bigint,
  estimatedFees: bigint,
  estimatedAmount: bigint | undefined,
): { amount: bigint; totalSpent: bigint } {
  const amountFallback = balance > estimatedFees ? balance - estimatedFees : 0n;
  const hasPositiveEstimatedAmount = estimatedAmount !== undefined && estimatedAmount > 0n;
  const amount = hasPositiveEstimatedAmount ? estimatedAmount : amountFallback;
  return { amount, totalSpent: amount + estimatedFees };
}

/**
 * Calculates final amounts based on transaction type
 * @param tokenBalanceForSendMax When set, FA2 send-max: full token amount; fees are paid in XTZ only
 */
function calculateAmounts(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
  estimatedFees: bigint,
  estimatedAmount: bigint | undefined,
  tokenBalanceForSendMax?: bigint,
): { amount: bigint; totalSpent: bigint } {
  if (intent.type === "stake") {
    if (!intent.useAllAmount) {
      return { amount: intent.amount, totalSpent: intent.amount + estimatedFees };
    }
    if (estimatedAmount !== undefined) {
      return { amount: estimatedAmount, totalSpent: estimatedAmount + estimatedFees };
    }
    // Mirrors estimateFees() stake-max formula for the !revealed short-circuit path.
    const amount = computeMaxStakeAmount(
      BigInt(senderInfo.balance),
      BigInt(senderInfo.stakedBalance ?? 0),
      estimatedFees,
    );
    return { amount, totalSpent: amount + estimatedFees };
  }

  if (intent.type === "unstake") {
    const stakedBalance = BigInt(senderInfo.stakedBalance ?? 0);
    const amount = intent.useAllAmount ? stakedBalance : intent.amount;
    return { amount, totalSpent: estimatedFees };
  }

  if (intent.type === "finalize_unstake") {
    return { amount: 0n, totalSpent: estimatedFees };
  }

  if (intent.type === "send" && intent.useAllAmount) {
    if (tokenBalanceForSendMax !== undefined) {
      return { amount: tokenBalanceForSendMax, totalSpent: estimatedFees };
    }
    return calculateNativeSendMaxAmountForUser(
      BigInt(senderInfo.balance),
      estimatedFees,
      estimatedAmount,
    );
  }

  const amount = intent.amount;
  return { amount, totalSpent: amount + estimatedFees };
}

/**
 * Validates balance coverage for the transaction
 */
function validateBalanceCoverage(
  senderInfo: APIUserAccount,
  totalSpent: bigint,
): Record<string, Error> {
  const errors: Record<string, Error> = {};
  const accountBalance = BigInt(senderInfo.balance);
  if (totalSpent > accountBalance) {
    errors.amount = new NotEnoughBalance();
  }
  return errors;
}

async function estimateFeesForIntent(
  intent: TransactionIntent,
  senderInfo: APIUserAccount,
): Promise<{
  estimatedFees: bigint;
  estimatedAmount: bigint | undefined;
  errors: Record<string, Error>;
}> {
  if (!senderInfo.revealed) {
    return { estimatedFees: 2000n, estimatedAmount: undefined, errors: {} };
  }

  const tezosMode = resolveValidationOperationMode(intent);
  const tokenInfo = tezosMode === "send_token" ? parseTezosTokenAsset(intent.asset)! : undefined;
  const estimation = await estimateFees({
    account: {
      address: intent.sender,
      revealed: senderInfo.revealed,
      balance: BigInt(senderInfo.balance),
      stakedBalance: BigInt(senderInfo.stakedBalance ?? 0),
      xpub: intent.senderPublicKey ?? senderInfo.publicKey,
    },
    transaction: {
      mode: tezosMode,
      recipient: intent.recipient,
      // finalize_unstake is a parameter-less operation; normalize amount to 0n so
      // fee estimation and the returned validation amount stay consistent.
      amount: intent.type === "finalize_unstake" ? 0n : intent.amount,
      useAllAmount: !!intent.useAllAmount,
      ...(tokenInfo && {
        contractAddress: tokenInfo.contractAddress,
        tokenId: tokenInfo.tokenId,
      }),
    },
  });

  const errors: Record<string, Error> = {};
  if (estimation.taquitoError) {
    Object.assign(errors, mapTaquitoErrors(estimation.taquitoError, intent.type));
  }

  return {
    estimatedFees: estimation.estimatedFees,
    estimatedAmount: estimation.amount,
    errors,
  };
}

async function fetchTokenBalanceForSendMax(intent: TransactionIntent): Promise<bigint | undefined> {
  if (intent.type !== "send" || !intent.useAllAmount) {
    return undefined;
  }

  const tezosMode = resolveTezosOperationMode(intent.type, intent.asset);
  if (tezosMode !== "send_token") {
    return undefined;
  }

  const tokenInfo = parseTezosTokenAsset(intent.asset);
  if (!tokenInfo) {
    return undefined;
  }

  const tokenBalances = await api.getTokensBalances(intent.sender, {
    contractAddress: tokenInfo.contractAddress,
    tokenId: tokenInfo.tokenId,
  });
  const row = tokenBalances.find(
    b =>
      b.token.contract.address === tokenInfo.contractAddress &&
      Number(b.token.tokenId) === tokenInfo.tokenId,
  );
  return row ? BigInt(row.balance) : 0n;
}

export async function validateIntent(intent: TransactionIntent): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  let estimatedFees: bigint;
  let estimatedAmount: bigint | undefined;
  let amount: bigint;
  let totalSpent: bigint;

  const basicErrors = validateBasicSendParams(intent);
  Object.assign(errors, basicErrors);

  if (Object.keys(errors).length > 0) {
    return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
  }

  try {
    const senderInfo = await api.getAccountByAddress(intent.sender);
    if (senderInfo.type !== "user") throw new Error("unexpected account type");

    // Finalizable amount lives on /v1/staking/unstake_requests, not the account
    // endpoint; only `finalize_unstake` validation needs it.
    const finalizable =
      intent.type === "finalize_unstake"
        ? await api.getUnstakeRequestsFinalizable(intent.sender)
        : 0n;

    const constraintErrors = validateTransactionConstraints(intent, senderInfo, finalizable);
    Object.assign(errors, constraintErrors);

    if (Object.keys(errors).length > 0) {
      return { errors, warnings, estimatedFees: 0n, amount: 0n, totalSpent: 0n };
    }

    const feeResult = await estimateFeesForIntent(intent, senderInfo);
    estimatedFees = feeResult.estimatedFees;
    estimatedAmount = feeResult.estimatedAmount;
    Object.assign(errors, feeResult.errors);

    const tokenBalanceForSendMax = await fetchTokenBalanceForSendMax(intent);

    const amounts = calculateAmounts(
      intent,
      senderInfo,
      estimatedFees,
      estimatedAmount,
      tokenBalanceForSendMax,
    );
    amount = amounts.amount;
    totalSpent = amounts.totalSpent;

    if (intent.type === "stake" && intent.useAllAmount && amount === 0n && !errors.amount) {
      errors.amount = new NotEnoughBalanceToDelegate();
    }

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
