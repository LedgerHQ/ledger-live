import { AccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import {
  KNOWN_TOPICS,
  LAST_SYNC_THRESHOLD_IN_DAYS,
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAX_AGE_BONUS,
  MAX_DISSOLVE_DELAY_BONUS,
  MAX_NEURON_AGE_FOR_AGE_BONUS,
  MIN_NEURON_STAKE,
  NNS_CLEAR_FOLLOWING_AFTER_SECONDS,
  NNS_MATURITY_MODULATION_WORST_CASE_FACTOR,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
  SECONDS_IN_DAY,
  SECONDS_IN_HOUR,
  SECONDS_IN_MINUTE,
  SECONDS_IN_MONTH,
  SECONDS_IN_YEAR,
} from "../consts";
import type { Transaction } from "../types/common";
import {
  ICPNeuron,
  ListNeuronsResponse,
  NeuronCommandOutcome,
  NeuronsData,
  NeuronState,
  RawNeuron,
  RawNeuronInfo,
} from "../types/neuron";

// ---- raw candid decode → normalized ICPNeuron --------------------------------------------------

const first = <T>(opt: [] | [T]): T | undefined => (opt.length ? opt[0] : undefined);

/** Derive a neuron's ledger account identifier (hex) from its 32-byte governance subaccount. */
export const neuronAccountIdentifier = (subaccount: Uint8Array | number[]): string => {
  const subAccount = SubAccount.fromBytes(Uint8Array.from(subaccount));
  if (subAccount instanceof Error) throw subAccount;
  return AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(MAINNET_GOVERNANCE_CANISTER_ID),
    subAccount,
  }).toHex();
};

// The voting-power fields appear on both the Neuron and the NeuronInfo record. NeuronInfo is the
// canister's own computed view, so prefer it and fall back to the full neuron.
const pick = <T>(fromInfo: ([] | [T]) | undefined, fromNeuron: [] | [T]): T | undefined =>
  (fromInfo && first(fromInfo)) ?? first(fromNeuron);

const toICPNeuron = (raw: RawNeuron, info?: RawNeuronInfo): ICPNeuron => {
  const id = first(raw.id)?.id;
  const dissolveState = first(raw.dissolve_state);
  const controller = first(raw.controller)?.toText();
  const votingPowerRefreshedTimestampSeconds = pick(
    info?.voting_power_refreshed_timestamp_seconds,
    raw.voting_power_refreshed_timestamp_seconds,
  );
  const decidingVotingPower = pick(info?.deciding_voting_power, raw.deciding_voting_power);
  const potentialVotingPower = pick(info?.potential_voting_power, raw.potential_voting_power);
  return {
    accountIdentifier: neuronAccountIdentifier(raw.account),
    state: (info?.state ?? NeuronState.Unspecified) as NeuronState,
    dissolveDelaySeconds: info?.dissolve_delay_seconds ?? 0n,
    ageSeconds: info?.age_seconds ?? 0n,
    cachedNeuronStakeE8s: raw.cached_neuron_stake_e8s,
    neuronFeesE8s: raw.neuron_fees_e8s,
    maturityE8sEquivalent: raw.maturity_e8s_equivalent,
    stakedMaturityE8sEquivalent: first(raw.staked_maturity_e8s_equivalent) ?? 0n,
    createdTimestampSeconds: raw.created_timestamp_seconds,
    hotKeys: raw.hot_keys.map(p => p.toText()),
    followees: raw.followees.map(([topic, { followees }]) => ({
      topic,
      followeeIds: followees.map(f => f.id),
    })),
    autoStakeMaturity: first(raw.auto_stake_maturity) ?? false,
    // Omitted when absent (not set to undefined) for exactOptionalPropertyTypes.
    ...(id !== undefined && { id }),
    ...(dissolveState !== undefined && { dissolveState }),
    ...(controller !== undefined && { controller }),
    ...(votingPowerRefreshedTimestampSeconds !== undefined && {
      votingPowerRefreshedTimestampSeconds,
    }),
    ...(decidingVotingPower !== undefined && { decidingVotingPower }),
    ...(potentialVotingPower !== undefined && { potentialVotingPower }),
  };
};

/** Fold a `list_neurons` response (full neurons + per-neuron info) into a NeuronsData snapshot. */
export const toNeuronsData = (
  response: ListNeuronsResponse,
  lastUpdatedMSecs: number = Date.now(),
): NeuronsData => {
  const infoById = new Map<bigint, RawNeuronInfo>(response.neuron_infos);
  const neurons = response.full_neurons.map(raw =>
    toICPNeuron(raw, first(raw.id) ? infoById.get(first(raw.id)!.id) : undefined),
  );
  return new NeuronsData(neurons, lastUpdatedMSecs);
};

// ---- state / dissolve --------------------------------------------------------------------------

export type NeuronActionPermissions = {
  canDisburse: boolean;
  canStartDissolving: boolean;
  canStopDissolving: boolean;
};

/** Which lifecycle actions the neuron's current state allows. */
export const getNeuronActionPermissions = (neuron: ICPNeuron): NeuronActionPermissions => {
  const base = { canDisburse: false, canStartDissolving: false, canStopDissolving: false };
  switch (neuron.state) {
    case NeuronState.Locked:
      return { ...base, canStartDissolving: true };
    case NeuronState.Dissolving:
      return { ...base, canStopDissolving: true };
    case NeuronState.Dissolved:
      return { ...base, canDisburse: true };
    default:
      return base;
  }
};

/** A dissolved neuron sets (not increases) its dissolve delay when re-locking. */
export const isNeuronDissolved = (neuron: ICPNeuron): boolean =>
  neuron.state === NeuronState.Dissolved;

export const hasFollowees = (neuron: ICPNeuron): boolean => neuron.followees.length > 0;

/** Remaining dissolve delay in seconds: the fixed delay when locked, the countdown when dissolving. */
export const getNeuronDissolveDurationSeconds = (
  neuron: ICPNeuron,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): bigint => {
  const { dissolveState } = neuron;
  if (!dissolveState) return 0n;
  if ("DissolveDelaySeconds" in dissolveState) return dissolveState.DissolveDelaySeconds;
  const remaining = dissolveState.WhenDissolvedTimestampSeconds - BigInt(nowSeconds);
  return remaining > 0n ? remaining : 0n;
};

// ---- voting power (Mission 70) ------------------------------------------------------------------

/**
 * Whether the dissolve delay is long enough for the canister to count the neuron's vote. Everything
 * downstream of voting hangs off this — voting power, periodic confirmation, the decay countdown —
 * so it is one predicate rather than the same comparison repeated at each site.
 */
export const neuronCanVote = (neuron: ICPNeuron): boolean =>
  neuron.dissolveDelaySeconds >= BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE);

/**
 * Bonus multiplier for a scalar (dissolve delay or age): 1 + maxBonus·(min(amount, cap)/cap)^convexity.
 * Mission 70 uses convexity 2 for the dissolve-delay bonus (quadratic), 1 for the age bonus (linear).
 */
export const bonusMultiplier = ({
  amount,
  amountForMaxBonus,
  maxBonus,
  convexity = 1,
}: {
  amount: bigint;
  amountForMaxBonus: number;
  maxBonus: number;
  convexity?: number;
}): number => {
  const proportion =
    amountForMaxBonus === 0 ? 0 : Math.min(Number(amount), amountForMaxBonus) / amountForMaxBonus;
  return 1 + maxBonus * proportion ** convexity;
};

export const dissolveDelayMultiplier = (delaySeconds: bigint): number =>
  bonusMultiplier({
    amount: delaySeconds,
    amountForMaxBonus: NNS_MAXIMUM_DISSOLVE_DELAY,
    maxBonus: MAX_DISSOLVE_DELAY_BONUS,
    convexity: 2,
  });

export const ageMultiplier = (ageSeconds: bigint): number =>
  bonusMultiplier({
    amount: ageSeconds,
    amountForMaxBonus: MAX_NEURON_AGE_FOR_AGE_BONUS,
    maxBonus: MAX_AGE_BONUS,
  });

// Fixed-point scale for the combined voting-power bonus. 1e15 keeps `round(bonus * scale)` below
// 2^53 (bonus <= 3x), so it stays an exact integer while preserving full double precision.
const VOTING_POWER_SCALE = 1_000_000_000_000_000n;

/** Potential voting power: what the neuron is worth ignoring periodic-confirmation decay. */
export const neuronPotentialVotingPower = (neuron: ICPNeuron): bigint => {
  if (!neuronCanVote(neuron)) return 0n;
  // The rewards-only "8-year gang" bonus is intentionally omitted: it depends on a snapshotted base
  // the wallet does not carry and does not affect potential voting power for post-migration neurons.
  const stakeE8s = neuronVotingStake(neuron);
  // Quantize the (fractional) bonus to a scaled integer so the e8s stake stays bigint — avoids the
  // Number() precision loss above 2^53 that would skew high-balance neurons.
  const scaledBonus = BigInt(
    Math.round(
      dissolveDelayMultiplier(neuron.dissolveDelaySeconds) *
        ageMultiplier(neuron.ageSeconds) *
        Number(VOTING_POWER_SCALE),
    ),
  );
  return (stakeE8s * scaledBonus) / VOTING_POWER_SCALE;
};

// ---- periodic confirmation ----------------------------------------------------------------------

/**
 * Seconds until the neuron loses its voting power entirely and has its following cleared.
 * `undefined` when the canister reported no refresh timestamp, which is also the case for neurons
 * persisted before that field was decoded: there, staleness is unknown, not zero.
 */
export const getSecondsTillVotingPowerExpires = (
  neuron: ICPNeuron,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): number | undefined => {
  const refreshed = neuron.votingPowerRefreshedTimestampSeconds;
  if (refreshed === undefined) return undefined;
  const deadline =
    refreshed +
    BigInt(NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS + NNS_CLEAR_FOLLOWING_AFTER_SECONDS);
  const remaining = deadline - BigInt(nowSeconds);
  return remaining > 0n ? Number(remaining) : 0;
};

/**
 * Deciding voting power: the potential power reduced by periodic-confirmation decay, i.e. what the
 * canister counts today. Full until the decay window opens, then linear to zero across it — the
 * canister's `deciding_voting_power_adjustment_factor` is a LinearMap over
 * [startReducing, startReducing + clearFollowing) onto 1..0, clamped (`network_economics.rs`).
 *
 * A missing refresh timestamp means undecayed, not expired: staleness is unknown there. Truncates
 * where the canister rounds half-to-even, a difference of at most one e8s.
 */
export const neuronDecidingVotingPower = (
  neuron: ICPNeuron,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): bigint => {
  const potential = neuronPotentialVotingPower(neuron);
  const remaining = getSecondsTillVotingPowerExpires(neuron, nowSeconds);
  if (remaining === undefined || remaining >= NNS_CLEAR_FOLLOWING_AFTER_SECONDS) return potential;
  return (potential * BigInt(remaining)) / BigInt(NNS_CLEAR_FOLLOWING_AFTER_SECONDS);
};

/**
 * Whether any neuron has entered the decay window and is actively losing voting power.
 * Neurons the canister reported no refresh timestamp for are skipped, so a snapshot persisted before
 * the decode change never raises a false alarm — the next list_neurons populates the field.
 */
export const votingPowerNeedsRefresh = (
  neurons: readonly ICPNeuron[],
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean =>
  neurons.some(neuron => {
    const refreshed = neuron.votingPowerRefreshedTimestampSeconds;
    // Only neurons eligible to vote are subject to periodic confirmation.
    if (refreshed === undefined) return false;
    if (!neuronCanVote(neuron)) return false;
    return BigInt(nowSeconds) >= refreshed + BigInt(NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS);
  });

/**
 * Whether the persisted snapshot is old enough to prompt a device-signed re-sync. Neurons are only
 * refreshed by a signed list_neurons call, so background sync never ages this out on its own.
 */
export const neuronsNeedSync = (neurons: NeuronsData, nowMSecs: number = Date.now()): boolean =>
  neurons.fullNeurons.length > 0 &&
  nowMSecs - neurons.lastUpdatedMSecs >= LAST_SYNC_THRESHOLD_IN_DAYS * SECONDS_IN_DAY * 1000;

/**
 * Whether the account's own principal controls the neuron rather than merely holding a hot key.
 * Hot keys may vote and set following, but cannot disburse, split, or change the dissolve delay.
 */
export const isDeviceControlledNeuron = (neuron: ICPNeuron, principal: string): boolean =>
  neuron.controller === principal;

// ---- optimistic command application -------------------------------------------------------------

/**
 * The neuron after the canister's `increase_dissolve_delay`, which both dissolve-delay commands land
 * on: `neuron/types.rs` validates `SetDissolveTimestamp` against the current delay and applies the
 * difference through the same function. Shaped after its three arms
 * (`neuron/dissolve_state_and_age.rs`), because which one runs decides whether the neuron ends up
 * locked or dissolving — the difference the card reports.
 */
const withIncreasedDissolveDelay = (
  neuron: ICPNeuron,
  additional: bigint,
  nowSeconds: number,
): ICPNeuron | undefined => {
  // The canister rejects a zero delta rather than treating it as a no-op.
  if (additional <= 0n) return undefined;
  const maximum = BigInt(NNS_MAXIMUM_DISSOLVE_DELAY);
  const capped = (seconds: bigint) => (seconds > maximum ? maximum : seconds);
  const next = capped(getNeuronDissolveDurationSeconds(neuron, nowSeconds) + additional);

  switch (neuron.state) {
    case NeuronState.Locked:
      // Aging is deliberately left alone: the canister carries `aging_since_timestamp_seconds` over.
      return {
        ...neuron,
        dissolveState: { DissolveDelaySeconds: next },
        dissolveDelaySeconds: next,
      };
    case NeuronState.Dissolving:
      // Still dissolving — the unlock timestamp moves out, the neuron does not re-lock.
      return {
        ...neuron,
        dissolveState: { WhenDissolvedTimestampSeconds: BigInt(nowSeconds) + next },
        dissolveDelaySeconds: next,
      };
    case NeuronState.Dissolved:
      // "This neuron is dissolved. Set it to non-dissolving." Its remaining delay is zero, so the
      // delta is the whole new delay, and aging restarts from now.
      return {
        ...neuron,
        state: NeuronState.Locked,
        dissolveState: { DissolveDelaySeconds: capped(additional) },
        dissolveDelaySeconds: capped(additional),
        ageSeconds: 0n,
      };
    default:
      return undefined;
  }
};

/**
 * The neuron as it stands after a `manage_neuron` command the canister has already accepted, or
 * `undefined` when the result cannot be reproduced locally.
 *
 * An accepted update call is final — governance state changed in the round that replied, with no
 * indexing lag — but only a device-signed `list_neurons` can read it back. Rather than ask for a
 * second signature per action, replay the commands whose effect is fully determined by the command
 * plus the current neuron, and the one that states its own result in the reply (stake_maturity).
 *
 * Split, spawn and disburse are what remain: each yields figures only the canister has, or a neuron
 * whose id it alone assigns, so they wait for an explicit refresh.
 */
const patchNeuron = (
  neuron: ICPNeuron,
  transaction: Transaction,
  nowSeconds: number,
  outcome: NeuronCommandOutcome | undefined,
): ICPNeuron | undefined => {
  switch (transaction.type) {
    case "start_dissolving": {
      if (neuron.state !== NeuronState.Locked) return undefined;
      const remaining = getNeuronDissolveDurationSeconds(neuron, nowSeconds);
      return {
        ...neuron,
        state: NeuronState.Dissolving,
        dissolveState: { WhenDissolvedTimestampSeconds: BigInt(nowSeconds) + remaining },
        dissolveDelaySeconds: remaining,
        // Dissolving parks `aging_since_timestamp_seconds` at u64::MAX, which reports as age zero,
        // so the age bonus stops accruing.
        ageSeconds: 0n,
      };
    }
    case "stop_dissolving": {
      if (neuron.state !== NeuronState.Dissolving) return undefined;
      const remaining = getNeuronDissolveDurationSeconds(neuron, nowSeconds);
      return {
        ...neuron,
        state: NeuronState.Locked,
        dissolveState: { DissolveDelaySeconds: remaining },
        dissolveDelaySeconds: remaining,
        // Aging restarts from the moment dissolving stops.
        ageSeconds: 0n,
      };
    }
    case "increase_dissolve_delay":
      if (!transaction.additionalDissolveDelay) return undefined;
      return withIncreasedDissolveDelay(
        neuron,
        BigInt(transaction.additionalDissolveDelay),
        nowSeconds,
      );
    case "set_dissolve_delay": {
      // The command carries an absolute unlock timestamp, which the canister turns into the delta
      // from the delay the neuron already has — and refuses a target at or below it, so there is
      // nothing to replay in that case.
      if (!transaction.dissolveDelay) return undefined;
      const delta =
        BigInt(transaction.dissolveDelay) - getNeuronDissolveDurationSeconds(neuron, nowSeconds);
      return withIncreasedDissolveDelay(neuron, delta, nowSeconds);
    }
    case "add_hot_key": {
      const hotKey = transaction.hotKeyToAdd;
      if (!hotKey || neuron.hotKeys.includes(hotKey)) return undefined;
      return { ...neuron, hotKeys: [...neuron.hotKeys, hotKey] };
    }
    case "remove_hot_key": {
      const hotKey = transaction.hotKeyToRemove;
      if (!hotKey) return undefined;
      return { ...neuron, hotKeys: neuron.hotKeys.filter(key => key !== hotKey) };
    }
    case "auto_stake_maturity":
      return { ...neuron, autoStakeMaturity: Boolean(transaction.autoStakeMaturity) };
    case "follow": {
      if (!transaction.followTopic) return undefined;
      const topic = KNOWN_TOPICS[transaction.followTopic];
      const followeeIds = (transaction.followeesIds ?? []).map(id => BigInt(id));
      const others = neuron.followees.filter(followee => followee.topic !== topic);
      // The command replaces the whole list for the topic, so an empty one clears it rather than
      // leaving an entry with no followees.
      return {
        ...neuron,
        followees: followeeIds.length === 0 ? others : [...others, { topic, followeeIds }],
      };
    }
    case "stake_maturity": {
      // The canister reports both totals after the split, so this is its answer rather than a local
      // re-derivation — which would have to apply the percentage to a maturity figure that may have
      // accrued since the snapshot was read, and match the canister's rounding.
      const { maturityE8s, stakedMaturityE8s } = outcome ?? {};
      // Checked against undefined, not for truthiness: staking the whole maturity reports "0".
      if (maturityE8s === undefined || stakedMaturityE8s === undefined) return undefined;
      return {
        ...neuron,
        maturityE8sEquivalent: BigInt(maturityE8s),
        stakedMaturityE8sEquivalent: BigInt(stakedMaturityE8s),
      };
    }
    case "refresh_voting_power":
      return {
        ...neuron,
        // Restarting the clock is what restores the power: neuronDecidingVotingPower derives the
        // figure from this timestamp, so the decoded snapshot field is brought along only to keep
        // the two from disagreeing.
        votingPowerRefreshedTimestampSeconds: BigInt(nowSeconds),
        decidingVotingPower: neuron.potentialVotingPower ?? neuronPotentialVotingPower(neuron),
      };
    default:
      return undefined;
  }
};

/**
 * The snapshot with `transaction`'s effect applied to the neuron it targets, or `undefined` when
 * nothing could be applied — in which case callers must leave the existing snapshot alone rather
 * than write an unchanged copy, so `lastUpdatedMSecs` keeps meaning "last read from the canister".
 *
 * `outcome` is what the accepted command reported about itself, where it reported anything; the
 * commands that need it cannot be replayed without it.
 */
export const applyNeuronCommand = (
  neurons: readonly ICPNeuron[],
  transaction: Transaction,
  {
    nowSeconds = Math.floor(Date.now() / 1000),
    outcome,
  }: { nowSeconds?: number; outcome?: NeuronCommandOutcome | undefined } = {},
): ICPNeuron[] | undefined => {
  if (!transaction.neuronId) return undefined;
  const index = neurons.findIndex(neuron => neuron.id?.toString() === transaction.neuronId);
  if (index === -1) return undefined;
  const patched = patchNeuron(neurons[index]!, transaction, nowSeconds, outcome);
  if (!patched) return undefined;
  const next = [...neurons];
  next[index] = patched;
  return next;
};

// ---- account banner -----------------------------------------------------------------------------

export type ICPBannerState =
  | "stakeICP"
  | "syncNeurons"
  | "confirmFollowing"
  | "lockNeurons"
  | "addFollowees"
  | "none";

/**
 * The single most urgent prompt for an account, in precedence order: stale data first (everything
 * below is judged from it), then losses that are already accruing, then setup the user never
 * finished.
 *
 * `lockNeurons` intentionally means "dissolve delay too short to vote". The original reference
 * tested `dissolveState === "Unlocked"`, which no NeuronState nor DissolveState variant can equal,
 * so that branch was dead and its intent had to be reconstructed.
 */
export const getBannerState = ({
  neurons,
  canStake,
  nowMSecs = Date.now(),
}: {
  neurons: NeuronsData;
  canStake: boolean;
  nowMSecs?: number;
}): ICPBannerState => {
  const { fullNeurons } = neurons;
  if (fullNeurons.length === 0) return canStake ? "stakeICP" : "none";
  if (neuronsNeedSync(neurons, nowMSecs)) return "syncNeurons";
  if (votingPowerNeedsRefresh(fullNeurons, Math.floor(nowMSecs / 1000))) return "confirmFollowing";
  if (fullNeurons.some(n => !neuronCanVote(n))) return "lockNeurons";
  if (fullNeurons.some(n => !hasFollowees(n))) return "addFollowees";
  return "none";
};

// ---- duration formatting ------------------------------------------------------------------------

export type DurationParts = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// Years and months use the NNS averages the governance canister itself uses, so a dissolve delay
// entered as "2 years" round-trips exactly.
const DURATION_UNITS = [
  ["years", SECONDS_IN_YEAR],
  ["months", SECONDS_IN_MONTH],
  ["days", SECONDS_IN_DAY],
  ["hours", SECONDS_IN_HOUR],
  ["minutes", SECONDS_IN_MINUTE],
] as const;

/**
 * Split a duration into display parts. Returns numbers rather than a formatted string so wording and
 * pluralization stay in the apps, where the translations live.
 */
export const secondsToDuration = (totalSeconds: bigint | number): DurationParts => {
  let rest = typeof totalSeconds === "bigint" ? totalSeconds : BigInt(Math.trunc(totalSeconds));
  if (rest < 0n) rest = 0n;
  const parts: DurationParts = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  for (const [unit, size] of DURATION_UNITS) {
    const divisor = BigInt(size);
    parts[unit] = Number(rest / divisor);
    rest %= divisor;
  }
  parts.seconds = Number(rest);
  return parts;
};

// ---- stake / split / maturity -------------------------------------------------------------------

/** Effective stake: cached stake minus accrued fees. The canister's `minted_stake_e8s`. */
export const neuronStake = (neuron: ICPNeuron): bigint => {
  const stake = neuron.cachedNeuronStakeE8s - neuron.neuronFeesE8s;
  return stake > 0n ? stake : 0n;
};

/**
 * The stake voting power is computed from: the effective stake plus staked maturity. Mirrors the
 * canister's `Neuron::stake_e8s` (`rs/nns/governance/src/neuron/mod.rs`), which subtracts the
 * rejection fees before adding staked maturity — omitting them overstates a penalised neuron's power.
 */
export const neuronVotingStake = (neuron: ICPNeuron): bigint =>
  neuronStake(neuron) + neuron.stakedMaturityE8sEquivalent;

/** A split must leave at least the minimum stake on both resulting neurons, plus the fee. */
export const minNeuronSplittable = (feeE8s: bigint): bigint =>
  2n * BigInt(MIN_NEURON_STAKE) + feeE8s;

export const neuronCanBeSplit = (neuron: ICPNeuron, feeE8s: bigint): boolean =>
  neuronStake(neuron) >= minNeuronSplittable(feeE8s);

/**
 * Bounds on the amount passed to `split`. The parent is debited the full amount and the child
 * receives it minus the fee, so the fee constrains the lower bound only.
 */
export const minAllowedSplitAmount = (feeE8s: bigint): bigint => BigInt(MIN_NEURON_STAKE) + feeE8s;

export const maxAllowedSplitAmount = (neuron: ICPNeuron): bigint => {
  const max = neuronStake(neuron) - BigInt(MIN_NEURON_STAKE);
  return max > 0n ? max : 0n;
};

export const hasEnoughMaturityToStake = (neuron: ICPNeuron): boolean =>
  neuron.maturityE8sEquivalent > 0n;

/** Selected maturity (percentage of the neuron's maturity) must survive worst-case modulation. */
export const isEnoughMaturityToSpawn = (neuron: ICPNeuron, percentage: number): boolean => {
  // Selected maturity stays in bigint (Nat64-safe); the worst-case threshold is a small integer.
  const selected = (neuron.maturityE8sEquivalent * BigInt(percentage)) / 100n;
  const minSelected = BigInt(
    Math.ceil(MIN_NEURON_STAKE / NNS_MATURITY_MODULATION_WORST_CASE_FACTOR),
  );
  return selected >= minSelected;
};
