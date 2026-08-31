import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import { findCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import {
  ClaimRewardsFeesWarning,
  HederaInsufficientFundsForAssociation,
  HederaInvalidStakingNodeIdError,
  HederaMemoExceededSizeError,
  HederaNoStakingRewardsError,
  HederaRecipientEvmAddressVerificationRequired,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
  HederaRedundantStakingNodeIdError,
} from "../errors";
import type { EstimateFeesParams, HederaCoinConfig, HederaMemo, HederaTxData } from "../types";
import { estimateFees } from "./estimateFees";
import { hasSpecificIntentData, mapIntentToSDKOperation } from "./utils";
import { validateMemo } from "./validateMemo";
import {
  checkAccountTokenAssociationStatus,
  getCurrencyToUSDRate,
  getHederaAccountForValidation,
  getHederaValidators,
  safeParseAccountId,
} from "../network/utils";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;
type HederaIntent = TransactionIntent<HederaMemo, HederaTxData>;

interface ValidateContext {
  config: HederaCoinConfig;
  currencyId: string;
  intent: HederaIntent;
  balances: Balance[];
  customFees: FeeEstimation | undefined;
}

// `erc20` references arrive from the EVM side in mixed case, hence the case-insensitive compare.
function findAssetBalance(asset: AssetInfo, balances: Balance[]): Balance | undefined {
  if (asset.type === "native") {
    return balances.find(b => b.asset.type === "native");
  }

  const reference = "assetReference" in asset ? asset.assetReference : undefined;
  if (!reference) return undefined;

  return balances.find(b => {
    if (b.asset.type !== asset.type || !("assetReference" in b.asset)) return false;
    return asset.type === "erc20"
      ? b.asset.assetReference?.toLowerCase() === reference.toLowerCase()
      : b.asset.assetReference === reference;
  });
}

// Deliberately stricter than the legacy bridge, which validated against the raw balance (LIVE-36147).
function available(balance: Balance | undefined): bigint {
  const value = (balance?.value ?? 0n) - (balance?.locked ?? 0n);
  return value > 0n ? value : 0n;
}

async function validateRecipient({
  config,
  sender,
  recipient,
}: {
  config: HederaCoinConfig;
  sender: string;
  recipient: string;
}): Promise<Error | null> {
  if (!recipient) {
    return new RecipientRequired();
  }

  const [parsingError, parsingResult] = await safeParseAccountId({
    configOrCurrencyId: config,
    address: recipient,
  });

  if (parsingError) {
    return parsingError;
  }

  if (parsingResult.accountId === sender) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  return null;
}

async function resolveEstimatedFees({
  config,
  currencyId,
  intent,
  customFees,
}: Pick<ValidateContext, "config" | "currencyId" | "intent" | "customFees">): Promise<bigint> {
  if (customFees?.value !== undefined && customFees.value !== 0n) {
    return customFees.value;
  }

  const operationType = mapIntentToSDKOperation(intent);
  const params: EstimateFeesParams =
    operationType === HEDERA_OPERATION_TYPES.ContractCall
      ? { configOrCurrencyId: config, operationType, txIntent: intent }
      : { currencyId, operationType };

  const result = await estimateFees(params);
  return BigInt(result.tinybars.toFixed(0));
}

// Without a USD rate the account counts as worthless and the flow stays blocked, as in the legacy bridge.
async function validateTokenAssociate({
  config,
  currencyId,
  intent,
  balances,
  customFees,
}: ValidateContext): Promise<TransactionValidation> {
  invariant(intent.asset.type === "hts", "hedera: association requires hts token type");
  const errors: Errors = {};
  const tokenId = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  const currency = findCryptoCurrencyById(currencyId);
  invariant(currency, `hedera: currency with id ${currencyId} not found`);
  const [usdRate, estimatedFees, isAlreadyAssociated] = await Promise.all([
    getCurrencyToUSDRate(currency),
    resolveEstimatedFees({ config, currencyId, intent, customFees }),
    tokenId
      ? checkAccountTokenAssociationStatus({
          configOrCurrencyId: config,
          address: intent.sender,
          tokenId,
        }).catch(() => false)
      : false,
  ]);

  if (!isAlreadyAssociated) {
    const nativeAvailable = available(findAssetBalance({ type: "native" }, balances));
    const hbarAvailable = new BigNumber(nativeAvailable.toString()).shiftedBy(-TINYBAR_SCALE);
    const worthInUSD = usdRate ? hbarAvailable.multipliedBy(usdRate) : new BigNumber(0);
    const requiredWorthInUSD = config.tokenAssociationMinUsd;

    if (worthInUSD.isLessThan(requiredWorthInUSD)) {
      errors.insufficientAssociateBalance = new HederaInsufficientFundsForAssociation("", {
        requiredWorthInUSD,
      });
    }
  }

  return {
    errors,
    warnings: {},
    estimatedFees,
    amount: 0n,
    totalSpent: estimatedFees,
  };
}

async function validateStaking({
  config,
  currencyId,
  intent,
  balances,
  customFees,
}: ValidateContext): Promise<TransactionValidation> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  // Undelegate and claim-rewards must not be blocked by a failed validator fetch.
  const isDelegateOrRedelegate =
    intent.type === HEDERA_TRANSACTION_MODES.Delegate ||
    intent.type === HEDERA_TRANSACTION_MODES.Redelegate;

  const [validators, estimatedFees] = await Promise.all([
    isDelegateOrRedelegate
      ? getHederaValidators({ currencyId, config }).catch(error =>
          error instanceof Error ? error : new Error(String(error)),
        )
      : null,
    resolveEstimatedFees({ config, currencyId, intent, customFees }),
  ]);
  const totalSpent = estimatedFees;

  if (validators instanceof Error) {
    errors.validators = validators;
  } else if (validators) {
    const stakingNodeId = hasSpecificIntentData(intent, "staking")
      ? intent.data.stakingNodeId
      : undefined;

    if (typeof stakingNodeId === "number") {
      const isValid = validators.some(validator => validator.id === String(stakingNodeId));

      if (!isValid) {
        errors.stakingNodeId = new HederaInvalidStakingNodeIdError();
      }

      const account = await getHederaAccountForValidation({
        currencyId,
        config,
        address: intent.sender,
      });

      // Do not normalise `-1` (the mirror node's "no longer delegated" value) — compare the raw number.
      if (account.staked_node_id === stakingNodeId) {
        errors.stakingNodeId = new HederaRedundantStakingNodeIdError();
      }
    } else {
      errors.missingStakingNodeId = new HederaInvalidStakingNodeIdError("Validator must be set");
    }
  }

  if (intent.type === HEDERA_TRANSACTION_MODES.ClaimRewards) {
    const account = await getHederaAccountForValidation({
      currencyId,
      config,
      address: intent.sender,
    });
    const pendingReward = BigInt(account.pending_reward);

    if (pendingReward <= 0n) {
      errors.noRewardsToClaim = new HederaNoStakingRewardsError();
    }

    if (estimatedFees > pendingReward) {
      warnings.claimRewardsFee = new ClaimRewardsFeesWarning();
    }
  }

  const nativeAvailable = available(findAssetBalance({ type: "native" }, balances));

  if (nativeAvailable < totalSpent) {
    errors.fee = new NotEnoughBalance("");
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: 0n,
    totalSpent,
  };
}

async function validateNativeSend({
  config,
  currencyId,
  intent,
  balances,
  customFees,
}: ValidateContext): Promise<TransactionValidation> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [recipientError, estimatedFees] = await Promise.all([
    validateRecipient({ config, sender: intent.sender, recipient: intent.recipient }),
    resolveEstimatedFees({ config, currencyId, intent, customFees }),
  ]);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  const nativeAvailable = available(findAssetBalance({ type: "native" }, balances));
  const maxSpendable = nativeAvailable > estimatedFees ? nativeAvailable - estimatedFees : 0n;
  const amount = intent.useAllAmount ? maxSpendable : intent.amount;
  const totalSpent = amount + estimatedFees;

  if (amount === 0n) {
    errors.amount = intent.useAllAmount ? new NotEnoughBalance("") : new AmountRequired();
  } else if (nativeAvailable < totalSpent) {
    errors.amount = new NotEnoughBalance("");
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

async function validateTokenSend({
  config,
  currencyId,
  intent,
  balances,
  customFees,
}: ValidateContext): Promise<TransactionValidation> {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const [recipientError, estimatedFees] = await Promise.all([
    validateRecipient({ config, sender: intent.sender, recipient: intent.recipient }),
    resolveEstimatedFees({ config, currencyId, intent, customFees }),
  ]);

  if (recipientError) {
    errors.recipient = recipientError;
  }

  const tokenId = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;

  if (intent.asset.type === "erc20") {
    warnings.unverifiedEvmAddress = new HederaRecipientEvmAddressVerificationRequired();
  } else if (intent.asset.type === "hts" && tokenId && !errors.recipient) {
    try {
      const hasRecipientTokenAssociated = await checkAccountTokenAssociationStatus({
        configOrCurrencyId: config,
        address: intent.recipient,
        tokenId,
      });

      if (!hasRecipientTokenAssociated) {
        warnings.missingAssociation = new HederaRecipientTokenAssociationRequired();
      }
    } catch {
      warnings.unverifiedAssociation = new HederaRecipientTokenAssociationUnverified();
    }
  }

  const tokenAvailable = available(findAssetBalance(intent.asset, balances));
  const nativeAvailable = available(findAssetBalance({ type: "native" }, balances));
  const amount = intent.useAllAmount ? tokenAvailable : intent.amount;
  const totalSpent = amount;

  // Deliberate legacy asymmetry: unlike native send, `useAllAmount` gets no zero-amount exemption.
  if (amount === 0n) {
    errors.amount = new AmountRequired();
  } else if (tokenAvailable < totalSpent) {
    errors.amount = new NotEnoughBalance();
  } else if (nativeAvailable < estimatedFees) {
    errors.amount = new NotEnoughBalance();
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

async function validateByMode(context: ValidateContext): Promise<TransactionValidation> {
  const { intent } = context;
  const isTokenAsset = intent.asset.type === "hts" || intent.asset.type === "erc20";

  if (intent.type === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return validateTokenAssociate(context);
  }

  if (intent.type === HEDERA_TRANSACTION_MODES.Send && isTokenAsset) {
    return validateTokenSend(context);
  }

  if (
    intent.type === HEDERA_TRANSACTION_MODES.Delegate ||
    intent.type === HEDERA_TRANSACTION_MODES.Undelegate ||
    intent.type === HEDERA_TRANSACTION_MODES.Redelegate ||
    intent.type === HEDERA_TRANSACTION_MODES.ClaimRewards
  ) {
    return validateStaking(context);
  }

  return validateNativeSend(context);
}

export async function validateIntent({
  config,
  currencyId,
  intent,
  balances,
  customFees,
}: ValidateContext): Promise<TransactionValidation> {
  const result = await validateByMode({ config, currencyId, intent, balances, customFees });

  if (validateMemo(intent.memo?.value)) {
    return result;
  }

  return {
    ...result,
    errors: {
      ...result.errors,
      transaction: new HederaMemoExceededSizeError(),
    },
  };
}
