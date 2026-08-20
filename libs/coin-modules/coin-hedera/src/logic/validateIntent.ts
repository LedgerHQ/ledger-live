import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import type { HederaCoinConfig } from "../config";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import {
  HederaInvalidStakingNodeIdError,
  HederaNoStakingRewardsError,
  HederaRedundantStakingNodeIdError,
} from "../errors";
import type { HederaMemo } from "../types";
import { estimateFees } from "./estimateFees";
import { getAccountInfo, type HederaAccountInfo } from "./getAccountInfo";
import { apiClient } from "../network/api";
import { safeParseAccountId } from "../network/utils";

/**
 * `TransactionIntent`'s declared type has no room for `mode`/`valId` — those are additions the
 * generic-coin-framework's own `GenericCoinFrameworkTransactionIntent`
 * (`ledger-live-common/bridge/generic-coin-framework/utils.ts`) layers on before calling this. `mode`
 * is only present when the framework also set `valId`, so branches below key on `intent.type`
 * (always present) rather than `intent.mode`.
 */
type HederaTransactionIntent = TransactionIntent<HederaMemo> & { valId?: string };

const STAKING_TYPES = new Set(["delegate", "undelegate", "redelegate", "claimReward"]);

function isTokenAsset(asset: AssetInfo): asset is AssetInfo & { assetReference: string } {
  return asset.type !== "native" && "assetReference" in asset;
}

function nativeAvailable(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  return (native?.value ?? 0n) - (native?.locked ?? 0n);
}

function tokenAvailable(
  balances: Balance[],
  asset: AssetInfo & { assetReference: string },
): bigint {
  const match = balances.find(
    b =>
      isTokenAsset(b.asset) &&
      b.asset.type === asset.type &&
      b.asset.assetReference === asset.assetReference,
  );
  return (match?.value ?? 0n) - (match?.locked ?? 0n);
}

async function validateRecipient(
  config: HederaCoinConfig,
  sender: string,
  recipient: string,
): Promise<Error | undefined> {
  if (!recipient) return new RecipientRequired();

  const [parsingError, parsingResult] = await safeParseAccountId({
    configOrCurrencyId: config,
    address: recipient,
  });
  if (parsingError) return parsingError;
  if (sender === parsingResult.accountId) return new InvalidAddressBecauseDestinationIsAlsoSource();
  return undefined;
}

async function estimateStandardFees(
  currencyId: string,
  customFees: FeeEstimation | undefined,
  operationType: Exclude<HEDERA_OPERATION_TYPES, HEDERA_OPERATION_TYPES.ContractCall>,
): Promise<bigint> {
  if (typeof customFees?.value === "bigint") return customFees.value;
  const { tinybars } = await estimateFees({ currencyId, operationType });
  return BigInt(tinybars.toFixed(0));
}

async function validateNativeSend(
  currencyId: string,
  config: HederaCoinConfig,
  intent: HederaTransactionIntent,
  balances: Balance[],
  customFees: FeeEstimation | undefined,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const available = nativeAvailable(balances);
  const estimatedFees = await estimateStandardFees(
    currencyId,
    customFees,
    HEDERA_OPERATION_TYPES.CryptoTransfer,
  );
  const spendable = available > estimatedFees ? available - estimatedFees : 0n;
  const amount = intent.useAllAmount ? spendable : intent.amount;
  const totalSpent = amount + estimatedFees;

  if (amount <= 0n) {
    errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  } else if (totalSpent > available) {
    errors.amount = new NotEnoughBalance();
  }

  const recipientError = await validateRecipient(config, intent.sender, intent.recipient);
  if (recipientError) errors.recipient = recipientError;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

async function validateTokenTransfer(
  currencyId: string,
  config: HederaCoinConfig,
  intent: HederaTransactionIntent,
  balances: Balance[],
  customFees: FeeEstimation | undefined,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const asset = intent.asset;
  if (!isTokenAsset(asset)) {
    throw new Error("validateTokenTransfer called with a non-token asset");
  }

  const estimatedFees =
    typeof customFees?.value === "bigint"
      ? customFees.value
      : asset.type === "erc20"
        ? BigInt(
            (
              await estimateFees({
                configOrCurrencyId: config,
                operationType: HEDERA_OPERATION_TYPES.ContractCall,
                txIntent: intent,
              })
            ).tinybars.toFixed(0),
          )
        : await estimateStandardFees(currencyId, undefined, HEDERA_OPERATION_TYPES.TokenTransfer);

  const amount = intent.amount;
  const totalSpent = amount;

  if (amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (tokenAvailable(balances, asset) < totalSpent) {
    errors.amount = new NotEnoughBalance();
  } else if (nativeAvailable(balances) < estimatedFees) {
    errors.amount = new NotEnoughBalance();
  }

  const recipientError = await validateRecipient(config, intent.sender, intent.recipient);
  if (recipientError) errors.recipient = recipientError;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

// `families/hedera/bridge/api.ts`'s `computeIntentType` (LIVE-36150) translates the generic
// `"changeTrust"` mode to this legacy `HEDERA_TRANSACTION_MODES.TokenAssociate` string before this
// ever runs — the same translation `craftTransaction`/`mapIntentToSDKOperation` rely on, so
// `intent.type` here always matches theirs.
//
// `insufficientAssociateBalance` (the USD-value funding floor `handleTokenAssociateTransaction`
// checks) is deliberately not ported: LIVE-36147's required bar is the four staking keys plus
// amount/balance, and this is a policy check, not a correctness one — genuinely nothing else to add.
async function validateChangeTrust(
  currencyId: string,
  customFees: FeeEstimation | undefined,
): Promise<TransactionValidation> {
  const estimatedFees = await estimateStandardFees(
    currencyId,
    customFees,
    HEDERA_OPERATION_TYPES.TokenAssociate,
  );
  return { errors: {}, warnings: {}, estimatedFees, amount: 0n, totalSpent: estimatedFees };
}

async function isKnownValidatorId(config: HederaCoinConfig, valId: string): Promise<boolean> {
  // `fetchAllPages: true` is required here (unlike the paginated `getValidators.ts`, which serves
  // the list-validators UI one page at a time): checking one specific id needs the complete node
  // list, not just the first page.
  const { nodes } = await apiClient.getNodes({ configOrCurrencyId: config, fetchAllPages: true });
  return nodes.some(node => node.node_id.toString() === valId);
}

async function validateStaking(
  currencyId: string,
  config: HederaCoinConfig,
  intent: HederaTransactionIntent,
  balances: Balance[],
  customFees: FeeEstimation | undefined,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const [accountInfo, estimatedFees] = await Promise.all([
    getAccountInfo(config, intent.sender) as Promise<HederaAccountInfo>,
    estimateStandardFees(currencyId, customFees, HEDERA_OPERATION_TYPES.CryptoUpdate),
  ]);

  if (intent.type === "delegate" || intent.type === "redelegate") {
    if (typeof intent.valId === "string" && intent.valId !== "") {
      if (!(await isKnownValidatorId(config, intent.valId))) {
        errors.stakingNodeId = new HederaInvalidStakingNodeIdError();
      }
    } else {
      errors.missingStakingNodeId = new HederaInvalidStakingNodeIdError("Validator must be set");
    }

    if (
      typeof accountInfo.stakedNodeId === "number" &&
      String(accountInfo.stakedNodeId) === intent.valId
    ) {
      errors.stakingNodeId = new HederaRedundantStakingNodeIdError();
    }
  }

  if (intent.type === "claimReward") {
    const pendingReward = new BigNumber(accountInfo.pendingReward);
    if (pendingReward.lte(0)) {
      errors.noRewardsToClaim = new HederaNoStakingRewardsError();
    }
    // `ClaimRewardsFeesWarning` (legacy: fee > pendingReward) needed `transaction.maxFee`, a
    // legacy-only field with no equivalent on the generic transaction — skipped, not silently
    // dropped: there is nothing to read it from.
  }

  const totalSpent = estimatedFees; // staking never moves a user-chosen amount
  if (nativeAvailable(balances) < totalSpent) {
    errors.fee = new NotEnoughBalance();
  }

  return { errors, warnings, estimatedFees, amount: 0n, totalSpent };
}

export async function validateIntent(
  currencyId: string,
  config: HederaCoinConfig,
  intent: HederaTransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  if (intent.type === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return validateChangeTrust(currencyId, customFees);
  }
  if (STAKING_TYPES.has(intent.type)) {
    return validateStaking(currencyId, config, intent, balances, customFees);
  }
  if (isTokenAsset(intent.asset)) {
    return validateTokenTransfer(currencyId, config, intent, balances, customFees);
  }
  return validateNativeSend(currencyId, config, intent, balances, customFees);
}
