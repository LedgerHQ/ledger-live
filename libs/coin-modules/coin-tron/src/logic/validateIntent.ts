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
import type { TronCoinConfig } from "../config";
import BigNumber from "bignumber.js";
import sumBy from "lodash/sumBy";
import { fetchTronAccount, getDelegatedResource, getTronSuperRepresentatives } from "../network";
import type { TronMemo, TronResources, TronTxData } from "../types";
import { MODES_NEEDING_RESOURCES, MODES_SPENDING_AMOUNT, MODES_WITH_RECIPIENT } from "./modes";
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
  TronUnexpectedFees,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import {
  ONE_TRX,
  REWARD_WITHDRAW_COOLDOWN_MS,
  TRX_CURRENCY_NAME,
  TRX_TICKER,
  TRX_UNIT,
} from "./constants";
import { estimateFees, type TronResourceBreakdown } from "./estimateFees";
import { defaultTronResources, fetchTronResources } from "./tronResources";
import { findBalance } from "./utils";
import { validateAddress } from "./validateAddress";

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
  config: TronCoinConfig,
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
    const tronResources = await fetchResources(config, intent.sender);
    validateResourceMode(mode, resource, votes, intent, tronResources, errors);
    if (mode === "vote") await validateVotes(config, votes, tronResources, errors);
  }

  if (mode === "unDelegateResource") {
    await validateUnDelegate(config, intent, resource, errors);
  }

  const { estimatedFees, breakdown } = await resolveFeeContext(
    config,
    intent,
    customFees,
    Object.keys(errors).length > 0,
  );

  const isToken = intent.asset.type !== "native";
  const nativeBalance = balances.find(b => b.asset.type === "native");
  // Frozen/unfreezing TRX is reported as `locked` and cannot pay for anything, so every spendability
  // question below is asked against the available part only.
  const nativeAvailable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  const spendable = isToken
    ? findAssetBalance(intent.asset, balances)
    : nativeSpendable(nativeAvailable, estimatedFees);

  const amount = intent.useAllAmount ? spendable : intent.amount;
  const amountSpent = MODES_SPENDING_AMOUNT.has(mode) ? amount : 0n;

  if (mode === "freeze" && new BigNumber(amount.toString()).lt(ONE_TRX)) {
    errors.amount = new TronInvalidFreezeAmount();
  }
  if (MODES_SPENDING_AMOUNT.has(mode)) {
    validateSpendable(amount, spendable, intent, breakdown, errors, warnings);
  }

  applyFeeFindings(estimatedFees, nativeAvailable, errors, warnings);

  // Fees are paid in TRX by the parent account, so a token send only spends the token amount.
  const totalSpent = isToken ? amountSpent : amountSpent + estimatedFees;

  return { errors, warnings, estimatedFees, amount: amountSpent, totalSpent };
}

/**
 * Resolve the fee value and, for a TRC20 send, the resource breakdown behind it — estimating only
 * when something actually needs it.
 *
 * A custom fee overrides the fee *value* but may carry the breakdown the caller already estimated — on
 * the wallet path the generic framework forwards `transaction.feeParameters` here, the estimation
 * `prepareTransaction` ran moments earlier. Gate on the breakdown's *contents*, never on its presence:
 * the framework always passes a `parameters` object, and a truthiness test would both skip the estimate
 * forever (silently dropping the energy warning) and feed `undefined` to the `BigInt()` reads later.
 *
 * Only two things read the estimate — the energy warning reads its breakdown, and `estimatedFees` falls
 * back to its value — so estimate only when one of those is in play. A caller supplying both (the wallet)
 * costs no RPC; one supplying neither (the coin-tester, a script) still gets a full estimate. An intent
 * that already failed a recipient/resource check cannot be signed anyway, so `hasErrors` skips it.
 */
async function resolveFeeContext(
  config: TronCoinConfig,
  intent: TransactionIntent<TronMemo, TronTxData>,
  customFees: FeeEstimation | undefined,
  hasErrors: boolean,
): Promise<{ estimatedFees: bigint; breakdown?: TronResourceBreakdown }> {
  const customBreakdown = asResourceBreakdown(customFees?.parameters);
  const needsBreakdown = intent.asset.type === "trc20" && !customBreakdown;
  const needsValue = customFees?.value === undefined;
  const estimation =
    !hasErrors && (needsBreakdown || needsValue) ? await estimateFees(config, intent) : undefined;
  const estimatedFees = customFees?.value ?? estimation?.value ?? 0n;
  const breakdown = customBreakdown ?? asResourceBreakdown(estimation?.parameters);
  return { estimatedFees, breakdown };
}

function nativeSpendable(nativeAvailable: bigint, estimatedFees: bigint): bigint {
  return nativeAvailable > estimatedFees ? nativeAvailable - estimatedFees : 0n;
}

function validateSpendable(
  amount: bigint,
  spendable: bigint,
  intent: TransactionIntent<TronMemo, TronTxData>,
  breakdown: TronResourceBreakdown | undefined,
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
): void {
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

function applyFeeFindings(
  estimatedFees: bigint,
  nativeAvailable: bigint,
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
): void {
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
}

async function validateUnDelegate(
  config: TronCoinConfig,
  intent: TransactionIntent<TronMemo, TronTxData>,
  resource: TronTxData["resource"],
  errors: Record<string, Error>,
): Promise<void> {
  if (!resource || !intent.recipient) return;
  const delegated = await getDelegatedResource(config, intent.sender, intent.recipient, resource);
  if (delegated.lt(new BigNumber(intent.amount.toString()))) {
    errors.resource = new TronInvalidUnDelegateResourceAmount();
  }
}

async function fetchResources(config: TronCoinConfig, sender: string): Promise<TronResources> {
  const accounts = await fetchTronAccount(config, sender);
  // The all-zero defaults are the truth for an account TronGrid has never seen, and they are what
  // makes the resource guards below fire: returning `undefined` would skip every one of them,
  // letting an unsignable staking intent through with no error at all.
  if (accounts.length === 0) return defaultTronResources;
  return fetchTronResources(config, accounts[0]);
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

  switch (mode) {
    case "unfreeze":
      return validateUnfreeze(resource, amount, tronResources, errors);
    case "legacyUnfreeze":
      return validateLegacyUnfreeze(resource, tronResources, errors);
    case "withdrawExpireUnfreeze":
      return validateWithdrawExpireUnfreeze(tronResources, errors);
    case "claimReward":
      return validateClaimReward(tronResources, errors);
    case "vote":
      if (votes.length === 0) errors.vote = new TronVoteRequired();
      return;
  }
}

function validateUnfreeze(
  resource: TronTxData["resource"],
  amount: BigNumber,
  tronResources: TronResources,
  errors: Record<string, Error>,
): void {
  const { bandwidth, energy } = tronResources.frozen;
  if (resource === "BANDWIDTH" && amount.gt(bandwidth?.amount ?? new BigNumber(0))) {
    errors.resource = new TronNoFrozenForBandwidth();
  } else if (resource === "ENERGY" && amount.gt(energy?.amount ?? new BigNumber(0))) {
    errors.resource = new TronNoFrozenForEnergy();
  }
}

function validateLegacyUnfreeze(
  resource: TronTxData["resource"],
  tronResources: TronResources,
  errors: Record<string, Error>,
): void {
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
}

function validateWithdrawExpireUnfreeze(
  tronResources: TronResources,
  errors: Record<string, Error>,
): void {
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
  if (hasExpired) return;

  // `unfreezing` is non-empty (guarded above), so seeding `reduce()` with its first element leaves
  // the result unchanged while satisfying the no-initial-value rule.
  const closest = unfreezing.reduce(
    (a, b) =>
      Math.abs(b.expireTime.getTime() - now) < Math.abs(a.expireTime.getTime() - now) ? b : a,
    unfreezing[0],
  );
  errors.resource = new TronUnfreezeNotExpired(undefined, {
    time: closest.expireTime.toISOString(),
  });
}

function validateClaimReward(tronResources: TronResources, errors: Record<string, Error>): void {
  if (tronResources.unwithdrawnReward.eq(0)) {
    errors.reward = new TronNoReward();
    return;
  }
  const lastWithdrawn = tronResources.lastWithdrawnRewardDate;
  if (!lastWithdrawn) return;
  const claimableAt = new Date(lastWithdrawn.getTime() + REWARD_WITHDRAW_COOLDOWN_MS);
  if (claimableAt.valueOf() > Date.now()) {
    errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
      until: claimableAt.toISOString(),
    });
  }
}

async function validateVotes(
  config: TronCoinConfig,
  votes: NonNullable<TronTxData["votes"]>,
  tronResources: TronResources,
  errors: Record<string, Error>,
): Promise<void> {
  if (votes.length === 0) return;

  const superRepresentatives = await getTronSuperRepresentatives(config);
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
