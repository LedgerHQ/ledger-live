import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  fetchTronAccount,
  getDelegatedResourceByAddress,
  getTronSuperRepresentatives,
  getUnwithdrawnReward,
} from "../network";
import { TronMemo, TronResource, Vote } from "../types";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronRewardNotAvailable,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import { estimateFees } from "./estimateFees";
import { getTronResources } from "./utils";
import { validateAddress } from "./validateAddress";

type TronStakingIntent = TransactionIntent<TronMemo> & {
  resource?: TronResource | null;
  votes?: Vote[];
};

// Modes that require a valid non-empty recipient
const RECIPIENT_REQUIRED_MODES = new Set(["send"]);
// Modes that validate the recipient when present (may be optional)
const RECIPIENT_VALIDATED_MODES = new Set(["send", "unDelegateResource", "legacyUnfreeze"]);
// Modes where amount > 0 is enforced and checked against spendable balance
const SEND_AMOUNT_MODES = new Set(["send", "freeze"]);
// Modes where the amount is added to totalSpent (for display)
const AMOUNT_SPENT_MODES = new Set(["send", "freeze", "unDelegateResource"]);

const ONE_TRX_SUN = 1_000_000n;

export async function validateIntent(
  transactionIntent: TransactionIntent<TronMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const intent = transactionIntent as TronStakingIntent;
  const { type = "send", sender, recipient } = intent;

  const estimatedFees =
    typeof customFees?.value === "bigint" ? customFees.value : await estimateFees(intent);

  // Recipient validation
  if (RECIPIENT_REQUIRED_MODES.has(type) && !recipient) {
    errors.recipient = new RecipientRequired();
  } else if (RECIPIENT_VALIDATED_MODES.has(type) && recipient) {
    if (recipient === sender) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (!(await validateAddress(recipient, {}))) {
      errors.recipient = new InvalidAddress("", { currencyName: "Tron" });
    }
  }

  // Staking/governance validations that require on-chain account state
  if (
    type === "unfreeze" ||
    type === "legacyUnfreeze" ||
    type === "withdrawExpireUnfreeze" ||
    type === "vote" ||
    type === "claimReward"
  ) {
    const [tronAcc] = await fetchTronAccount(sender);
    const resources = tronAcc ? getTronResources(tronAcc) : null;

    if (type === "unfreeze") {
      const frozenAmount =
        intent.resource === "BANDWIDTH"
          ? resources?.frozen.bandwidth?.amount
          : resources?.frozen.energy?.amount;
      if (!frozenAmount || frozenAmount.lte(0) || frozenAmount.lt(intent.amount.toString())) {
        errors.resource =
          intent.resource === "BANDWIDTH"
            ? new TronNoFrozenForBandwidth()
            : new TronNoFrozenForEnergy();
      }
    }

    if (type === "legacyUnfreeze") {
      const legacyEntry =
        intent.resource === "ENERGY"
          ? resources?.legacyFrozen.energy
          : resources?.legacyFrozen.bandwidth;
      if (!legacyEntry) {
        errors.resource =
          intent.resource === "BANDWIDTH"
            ? new TronNoFrozenForBandwidth()
            : new TronNoFrozenForEnergy();
      } else if (Date.now() < legacyEntry.expiredAt.getTime()) {
        errors.resource = new TronLegacyUnfreezeNotExpired();
      }
    }

    if (type === "withdrawExpireUnfreeze") {
      const unFrozen = resources?.unFrozen;
      const all = [...(unFrozen?.bandwidth ?? []), ...(unFrozen?.energy ?? [])];
      if (all.length === 0) {
        errors.resource = new TronNoUnfrozenResource();
      } else {
        const now = Date.now();
        const hasExpired = all.some(u => u.expireTime.getTime() <= now);
        if (!hasExpired) {
          const closest = all.reduce((min, u) => (u.expireTime < min.expireTime ? u : min));
          errors.resource = new TronUnfreezeNotExpired(undefined, {
            time: closest.expireTime.toISOString(),
          });
        }
      }
    }

    if (type === "vote") {
      const votes = intent.votes ?? [];
      if (votes.length === 0) {
        errors.vote = new TronVoteRequired();
      } else {
        const superReps = await getTronSuperRepresentatives();
        const isValidVoteCounts = votes.every(v => v.voteCount > 0);
        const isValidAddresses = votes.every(v => superReps.some(s => s.address === v.address));
        if (!isValidAddresses) {
          errors.vote = new InvalidAddress("", { currencyName: "Tron" });
        } else if (!isValidVoteCounts) {
          errors.vote = new TronInvalidVoteCount();
        } else {
          const tronPower = resources?.tronPower ?? 0;
          const totalVoteCount = votes.reduce((sum, v) => sum + v.voteCount, 0);
          if (totalVoteCount > tronPower) {
            errors.vote = new TronNotEnoughTronPower();
          }
        }
      }
    }

    if (type === "claimReward") {
      const unwithdrawnReward = await getUnwithdrawnReward(sender);
      if (unwithdrawnReward.eq(0)) {
        errors.reward = new TronNoReward();
      } else if (resources?.lastWithdrawnRewardDate) {
        const claimableAt = new Date(
          resources.lastWithdrawnRewardDate.getTime() + 24 * 60 * 60 * 1000,
        );
        if (claimableAt.getTime() > Date.now()) {
          errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
            until: claimableAt.toISOString(),
          });
        }
      }
    }
  }

  if (type === "unDelegateResource" && intent.resource && recipient) {
    const delegated = await getDelegatedResourceByAddress(sender, recipient, intent.resource);
    if (delegated.lt(intent.amount.toString())) {
      errors.resource = new TronInvalidUnDelegateResourceAmount();
    }
  }

  // Balance / amount validation
  const isToken = intent.asset.type !== "native";
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const nativeAvailable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  if (nativeAvailable < estimatedFees) {
    errors.gasLimit = new NotEnoughGas(undefined, { fees: estimatedFees.toString() });
  }

  if (SEND_AMOUNT_MODES.has(type)) {
    const spendable = isToken
      ? findAssetBalance(intent.asset, balances)
      : nativeAvailable > estimatedFees
        ? nativeAvailable - estimatedFees
        : 0n;

    const amount = intent.useAllAmount ? spendable : intent.amount;

    if (type === "freeze" && amount > 0n && amount < ONE_TRX_SUN) {
      errors.amount = new TronInvalidFreezeAmount();
    } else if (amount <= 0n) {
      errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    } else if (amount > spendable) {
      errors.amount = new NotEnoughBalance();
    }

    const totalSpent = AMOUNT_SPENT_MODES.has(type)
      ? isToken
        ? amount
        : amount + estimatedFees
      : estimatedFees;

    return { errors, warnings, estimatedFees, amount, totalSpent };
  }

  // Non-send staking modes: amount field is not a free-TRX spend
  const stakingAmount = AMOUNT_SPENT_MODES.has(type) ? intent.amount : 0n;
  return {
    errors,
    warnings,
    estimatedFees,
    amount: stakingAmount,
    totalSpent: stakingAmount + estimatedFees,
  };
}

// Token-only lookup (native spendable is derived from `nativeAvailable` above).
// Match on asset type first so a TRC10 balance can never satisfy a TRC20 intent
// even if their references collide, and subtract `locked` to stay consistent with
// the native spendable computation.
function findAssetBalance(asset: AssetInfo, balances: Balance[]): bigint {
  if (!("assetReference" in asset)) return 0n;
  const match = balances.find(
    b =>
      b.asset.type === asset.type &&
      "assetReference" in b.asset &&
      b.asset.assetReference === asset.assetReference,
  );
  const available = (match?.value ?? 0n) - (match?.locked ?? 0n);
  return available > 0n ? available : 0n;
}
