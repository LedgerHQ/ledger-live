import { AccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAX_AGE_BONUS,
  MAX_DISSOLVE_DELAY_BONUS,
  MAX_NEURON_AGE_FOR_AGE_BONUS,
  MIN_NEURON_STAKE,
  NNS_MATURITY_MODULATION_WORST_CASE_FACTOR,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
} from "../consts";
import {
  ICPNeuron,
  ListNeuronsResponse,
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

const toICPNeuron = (raw: RawNeuron, info?: RawNeuronInfo): ICPNeuron => {
  const id = first(raw.id)?.id;
  const dissolveState = first(raw.dissolve_state);
  const controller = first(raw.controller)?.toText();
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

/** Potential voting power. Returns 0 below the vote-eligibility dissolve delay. */
export const neuronPotentialVotingPower = (neuron: ICPNeuron): bigint => {
  if (neuron.dissolveDelaySeconds < BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE)) return 0n;
  // The rewards-only "8-year gang" bonus is intentionally omitted: it depends on a snapshotted base
  // the wallet does not carry and does not affect potential voting power for post-migration neurons.
  const stakeE8s = neuron.cachedNeuronStakeE8s + neuron.stakedMaturityE8sEquivalent;
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

// ---- stake / split / maturity -------------------------------------------------------------------

/** Effective stake: cached stake minus accrued fees. */
export const neuronStake = (neuron: ICPNeuron): bigint => {
  const stake = neuron.cachedNeuronStakeE8s - neuron.neuronFeesE8s;
  return stake > 0n ? stake : 0n;
};

/** A split must leave at least the minimum stake on both resulting neurons, plus the fee. */
export const minNeuronSplittable = (feeE8s: bigint): bigint =>
  2n * BigInt(MIN_NEURON_STAKE) + feeE8s;

export const neuronCanBeSplit = (neuron: ICPNeuron, feeE8s: bigint): boolean =>
  neuronStake(neuron) >= minNeuronSplittable(feeE8s);

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
