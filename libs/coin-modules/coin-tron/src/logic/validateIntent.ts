import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import sumBy from "lodash/sumBy";
import {
  fetchTronAccount,
  fetchTronContract,
  getDelegatedResource,
  getTronSuperRepresentatives,
} from "../network";
import type { TronMemo, TronResources, TronTxData } from "../types";
import {
  NotEnoughGas,
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughEnergy,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronRewardNotAvailable,
  TronSendTrc20ToNewAccountForbidden,
  TronUnexpectedFees,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import { ONE_TRX, TRX_CURRENCY_NAME, TRX_TICKER, TRX_UNIT } from "./constants";
import { estimateFees, type TronResourceBreakdown } from "./estimateFees";
import { defaultTronResources, fetchTronResources } from "./tronResources";
import { findBalance } from "./utils";
import { validateAddress } from "./validateAddress";

/** Modes that carry a recipient the user is sending to / reclaiming from. */
const MODES_WITH_RECIPIENT = new Set(["send", "unDelegateResource", "legacyUnfreeze"]);
/** Modes where the intent amount leaves the spendable balance. */
const MODES_SPENDING_AMOUNT = new Set(["send", "freeze"]);
/** Modes whose validation needs the account's staked-resource state. */
const MODES_NEEDING_RESOURCES = new Set([
  "unfreeze",
  "legacyUnfreeze",
  "withdrawExpireUnfreeze",
  "vote",
  "claimReward",
]);

/**
 * Narrow an opaque `FeeEstimation.parameters` bag to a usable resource breakdown.
 *
 * The bag reaches us from two directions — a caller's custom fee and our own fee estimation — and only
 * the second is guaranteed to carry the resource figures. Returning `undefined` for the other case
 * keeps every consumer from having to re-check each field.
 */
function asResourceBreakdown(value: unknown): TronResourceBreakdown | undefined {
  const candidate = value as Partial<TronResourceBreakdown> | undefined;
  return candidate?.energyRequired !== undefined && candidate.energyAvailable !== undefined
    ? (candidate as TronResourceBreakdown)
    : undefined;
}

export async function validateIntent(
  intent: TransactionIntent<TronMemo, TronTxData>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const mode = intent.type || "send";
  // `data` is a required member of the intent, but a hand-built intent (the coin-tester, a script)
  // can still omit it, so every read below tolerates its absence.
  const data: TronTxData | undefined = intent.data;
  const resource = data?.resource;
  const votes = data?.votes ?? [];

  // A rejecting probe (TronGrid down) rejects the whole validation: an unverifiable recipient or
  // resource state must not be reported as valid.
  await validateRecipient(intent, mode, errors);

  if (MODES_NEEDING_RESOURCES.has(mode)) {
    const tronResources = await fetchResources(intent.sender);
    validateResourceMode(mode, resource, votes, intent, tronResources, errors);
    if (mode === "vote") await validateVotes(votes, tronResources, errors);
  }

  if (mode === "unDelegateResource" && resource && intent.recipient) {
    const delegated = await getDelegatedResource(intent.sender, intent.recipient, resource);
    if (delegated.lt(new BigNumber(intent.amount.toString()))) {
      errors.resource = new TronInvalidUnDelegateResourceAmount();
    }
  }

  // A custom fee overrides the fee *value* but may carry the breakdown the caller already estimated.
  // Gate on the breakdown's *contents*, never on its presence: the generic framework always passes a
  // `parameters` object, populated with its own fee fields and never with the resource figures. A
  // truthiness test would both skip the estimate forever (silently dropping the energy warning) and
  // feed `undefined` to the `BigInt()` reads below.
  const customBreakdown = asResourceBreakdown(customFees?.parameters);
  // Estimating costs several RPC calls, and an intent that already failed a recipient/resource check
  // cannot be signed anyway — so skip it. The fee row and the energy/bandwidth tooltip both treat a
  // 0 alongside errors as "unknown" rather than "free".
  const estimation =
    Object.keys(errors).length === 0 && !customBreakdown ? await estimateFees(intent) : undefined;
  const estimatedFees = customFees?.value ?? estimation?.value ?? 0n;
  const breakdown = customBreakdown ?? asResourceBreakdown(estimation?.parameters);

  const isToken = intent.asset.type !== "native";
  const nativeBalance = balances.find(b => b.asset.type === "native");
  // Frozen/unfreezing TRX is reported as `locked` and cannot pay for anything, so every spendability
  // question below is asked against the available part only.
  const nativeAvailable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  const spendable = isToken
    ? findAssetBalance(intent.asset, balances)
    : nativeAvailable > estimatedFees
      ? nativeAvailable - estimatedFees
      : 0n;

  const amount = intent.useAllAmount ? spendable : intent.amount;
  const amountSpent = MODES_SPENDING_AMOUNT.has(mode) ? amount : 0n;

  if (mode === "freeze" && new BigNumber(amount.toString()).lt(ONE_TRX)) {
    errors.amount = new TronInvalidFreezeAmount();
  }

  if (MODES_SPENDING_AMOUNT.has(mode)) {
    if (amount <= 0n) {
      // A resolved send-max of 0 means the balance is fully consumed by fees/locks.
      errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    } else if (amount > spendable) {
      errors.amount = new NotEnoughBalance();
    }

    // The real energy requirement exceeds what the account has staked, so TRX will be burned.
    if (
      intent.asset.type === "trc20" &&
      breakdown &&
      BigInt(breakdown.energyRequired) > BigInt(breakdown.energyAvailable)
    ) {
      warnings.amount = new TronNotEnoughEnergy();
    }
  }

  if (!errors.recipient && estimatedFees > 0n) {
    warnings.fee = new TronUnexpectedFees("Estimated fees", {
      fees: formatCurrencyUnit(TRX_UNIT, new BigNumber(estimatedFees.toString()), {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  // PTX swap deeplinks into buying more TRX from this. An energy-covered TRC20 transfer owes 0 TRX,
  // so a zero-balance account can still send it.
  if (nativeAvailable < estimatedFees) {
    errors.gasLimit = new NotEnoughGas(undefined, {
      fees: formatCurrencyUnit(TRX_UNIT, new BigNumber(estimatedFees.toString())),
      ticker: TRX_TICKER,
      cryptoName: TRX_CURRENCY_NAME,
      links: ["ledgerlive://buy"],
    });
  }

  // Fees are paid in TRX by the parent account, so a token send only spends the token amount.
  const totalSpent = isToken ? amountSpent : amountSpent + estimatedFees;

  return { errors, warnings, estimatedFees, amount: amountSpent, totalSpent };
}

async function fetchResources(sender: string): Promise<TronResources> {
  const accounts = await fetchTronAccount(sender);
  // The all-zero defaults are the truth for an account TronGrid has never seen, and they are what
  // makes the resource guards below fire: returning `undefined` would skip every one of them,
  // letting an unsignable staking intent through with no error at all.
  if (accounts.length === 0) return defaultTronResources;
  return fetchTronResources(accounts[0]);
}

async function validateRecipient(
  intent: TransactionIntent<TronMemo, TronTxData>,
  mode: string,
  errors: Record<string, Error>,
): Promise<void> {
  const { recipient, sender } = intent;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
    return;
  }

  // freeze / vote / claimReward / withdrawExpireUnfreeze carry no recipient — validating one would
  // reject every such intent outright.
  if (!MODES_WITH_RECIPIENT.has(mode)) return;

  if (recipient === sender) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    return;
  }
  if (recipient && !(await validateAddress(recipient, {}))) {
    errors.recipient = new InvalidAddress(undefined, { currencyName: TRX_CURRENCY_NAME });
    return;
  }

  if (recipient && mode === "send" && intent.asset.type === "trc20") {
    // Sending TRC20 to a not-yet-activated account is forbidden: the transfer would not activate it
    // and the funds would be stranded. Sending to a smart contract is fine.
    //
    // The check is on the **recipient**, not on the token's contract address — a contract address is
    // a contract by definition, so checking it would make this guard unable to fire for the one case
    // it exists to catch.
    const [contract, accounts] = await Promise.all([
      fetchTronContract(recipient),
      fetchTronAccount(recipient),
    ]);
    if (contract === undefined && accounts.length === 0) {
      errors.recipient = new TronSendTrc20ToNewAccountForbidden();
    }
  }
}

function validateResourceMode(
  mode: string,
  resource: TronTxData["resource"],
  votes: NonNullable<TronTxData["votes"]>,
  intent: TransactionIntent<TronMemo, TronTxData>,
  tronResources: TronResources,
  errors: Record<string, Error>,
): void {
  const amount = new BigNumber(intent.amount.toString());

  if (mode === "unfreeze") {
    const { bandwidth, energy } = tronResources.frozen;
    if (resource === "BANDWIDTH" && amount.gt(bandwidth?.amount ?? new BigNumber(0))) {
      errors.resource = new TronNoFrozenForBandwidth();
    } else if (resource === "ENERGY" && amount.gt(energy?.amount ?? new BigNumber(0))) {
      errors.resource = new TronNoFrozenForEnergy();
    }
    return;
  }

  if (mode === "legacyUnfreeze") {
    const expirationDate =
      resource === "ENERGY"
        ? tronResources.legacyFrozen.energy?.expiredAt
        : tronResources.legacyFrozen.bandwidth?.expiredAt;

    if (!expirationDate) {
      errors.resource =
        resource === "BANDWIDTH" ? new TronNoFrozenForBandwidth() : new TronNoFrozenForEnergy();
    } else if (Date.now() < expirationDate.getTime()) {
      errors.resource = new TronLegacyUnfreezeNotExpired();
    }
    return;
  }

  if (mode === "withdrawExpireUnfreeze") {
    const unfreezing = [
      ...(tronResources.unFrozen.bandwidth ?? []),
      ...(tronResources.unFrozen.energy ?? []),
    ];
    if (unfreezing.length === 0) {
      errors.resource = new TronNoUnfrozenResource();
      return;
    }
    const now = Date.now();
    const hasExpired = unfreezing.some(u => u.expireTime.getTime() <= now);
    if (!hasExpired) {
      const closest = unfreezing.reduce((a, b) =>
        Math.abs(b.expireTime.getTime() - now) < Math.abs(a.expireTime.getTime() - now) ? b : a,
      );
      errors.resource = new TronUnfreezeNotExpired(undefined, {
        time: closest.expireTime.toISOString(),
      });
    }
    return;
  }

  if (mode === "claimReward") {
    if (tronResources.unwithdrawnReward.eq(0)) {
      errors.reward = new TronNoReward();
      return;
    }
    // Rewards are claimable once every 24h.
    const lastWithdrawn = tronResources.lastWithdrawnRewardDate;
    if (lastWithdrawn) {
      const claimableAt = new Date(lastWithdrawn.getTime() + 24 * 60 * 60 * 1000);
      if (claimableAt.valueOf() > Date.now()) {
        errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
          until: claimableAt.toISOString(),
        });
      }
    }
    return;
  }

  if (mode === "vote" && votes.length === 0) {
    errors.vote = new TronVoteRequired();
  }
}

async function validateVotes(
  votes: NonNullable<TronTxData["votes"]>,
  tronResources: TronResources,
  errors: Record<string, Error>,
): Promise<void> {
  if (votes.length === 0) return;

  const superRepresentatives = await getTronSuperRepresentatives();
  const isValidAddresses = votes.every(v =>
    superRepresentatives.some(s => s.address === v.address),
  );

  if (!isValidAddresses) {
    errors.vote = new InvalidAddress("", { currencyName: TRX_CURRENCY_NAME });
    return;
  }
  if (!votes.every(v => v.voteCount > 0)) {
    errors.vote = new TronInvalidVoteCount();
    return;
  }
  if (sumBy(votes, "voteCount") > tronResources.tronPower) {
    errors.vote = new TronNotEnoughTronPower();
  }
}

// Token-only lookup (native spendable is derived from `nativeAvailable` above). `locked` is
// subtracted to stay consistent with the native spendable computation.
function findAssetBalance(asset: AssetInfo, balances: Balance[]): bigint {
  const match = findBalance(asset, balances);
  const available = (match?.value ?? 0n) - (match?.locked ?? 0n);
  return available > 0n ? available : 0n;
}
