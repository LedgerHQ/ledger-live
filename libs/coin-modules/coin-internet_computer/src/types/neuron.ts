import type { Principal } from "@dfinity/principal";

// NNS neuron lifecycle state (dfinity/ic NNS NeuronState enum; @dfinity/nns governance.enums.ts).
export enum NeuronState {
  Unspecified = 0,
  Locked = 1,
  Dissolving = 2,
  Dissolved = 3,
  Spawning = 4,
}

// Governance `DissolveState` variant: locked → fixed delay; dissolving → fixed unlock timestamp.
export type NeuronDissolveState =
  | { DissolveDelaySeconds: bigint }
  | { WhenDissolvedTimestampSeconds: bigint };

/**
 * What a `manage_neuron` reply reported about the command it just ran, for the commands whose result
 * the canister computes rather than the caller.
 *
 * Decimal strings, as everything else on an operation's `extra` is — that record is serialized, and
 * bigint has no JSON form.
 */
export type NeuronCommandOutcome = {
  /** StakeMaturity: the neuron's maturity totals after the split, both reported by the canister. */
  maturityE8s?: string;
  stakedMaturityE8s?: string;
};

// `topic` is the NNS Topic id (see KNOWN_TOPICS).
export type Followee = {
  topic: number;
  followeeIds: bigint[];
};

/** Normalized neuron (from the raw `list_neurons` decode via `toICPNeuron`). Amounts e8s, durations seconds. */
export type ICPNeuron = {
  id?: bigint;
  // The neuron's ledger account identifier (hex), i.e. a subaccount of the governance canister.
  accountIdentifier: string;
  state: NeuronState;
  dissolveDelaySeconds: bigint;
  ageSeconds: bigint;
  cachedNeuronStakeE8s: bigint;
  neuronFeesE8s: bigint;
  maturityE8sEquivalent: bigint;
  stakedMaturityE8sEquivalent: bigint;
  createdTimestampSeconds: bigint;
  dissolveState?: NeuronDissolveState;
  controller?: string;
  hotKeys: string[];
  followees: Followee[];
  autoStakeMaturity: boolean;
  // Periodic-confirmation fields. All three are optional on the wire and absent from neurons
  // persisted before they were decoded, so every consumer must treat "missing" as "unknown" rather
  // than as zero — see votingPowerNeedsRefresh.
  votingPowerRefreshedTimestampSeconds?: bigint;
  // Voting power the canister will actually count, after periodic-confirmation decay.
  decidingVotingPower?: bigint;
  // Voting power ignoring decay. Equals the locally computed neuronPotentialVotingPower.
  potentialVotingPower?: bigint;
};

// ---- Raw candid decode shapes (subset actually read by the wallet) ------------------------------
// Candid decodes optionals as `[] | [value]` and principals/subaccounts as their @dfinity types.

export type RawDissolveState =
  | { DissolveDelaySeconds: bigint }
  | { WhenDissolvedTimestampSeconds: bigint };

export type RawNeuron = {
  id: [] | [{ id: bigint }];
  account: Uint8Array | number[];
  controller: [] | [Principal];
  hot_keys: Principal[];
  cached_neuron_stake_e8s: bigint;
  neuron_fees_e8s: bigint;
  created_timestamp_seconds: bigint;
  aging_since_timestamp_seconds: bigint;
  dissolve_state: [] | [RawDissolveState];
  followees: Array<[number, { followees: Array<{ id: bigint }> }]>;
  maturity_e8s_equivalent: bigint;
  staked_maturity_e8s_equivalent: [] | [bigint];
  auto_stake_maturity: [] | [boolean];
  voting_power_refreshed_timestamp_seconds: [] | [bigint];
  potential_voting_power: [] | [bigint];
  deciding_voting_power: [] | [bigint];
};

export type RawNeuronInfo = {
  state: number;
  age_seconds: bigint;
  dissolve_delay_seconds: bigint;
  voting_power_refreshed_timestamp_seconds: [] | [bigint];
  potential_voting_power: [] | [bigint];
  deciding_voting_power: [] | [bigint];
};

export type ListNeuronsResponse = {
  neuron_infos: Array<[bigint, RawNeuronInfo]>;
  full_neurons: RawNeuron[];
};

// ---- Persisted account snapshot -----------------------------------------------------------------

export type NeuronsDataRaw = {
  neurons: string;
  lastUpdated: number;
};

// JSON has no bigint: tag on write, restore on read, so the round-trip is lossless.
const bigIntReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? { $bigint: value.toString() } : value;

const bigIntReviver = (_key: string, value: unknown): unknown =>
  value && typeof value === "object" && "$bigint" in (value as Record<string, unknown>)
    ? BigInt((value as { $bigint: string }).$bigint)
    : value;

/** Neurons on an ICPAccount + last-refresh timestamp (drives re-fetch). Persisted via serialize/deserialize. */
export class NeuronsData {
  constructor(
    readonly fullNeurons: ICPNeuron[] = [],
    readonly lastUpdatedMSecs: number = 0,
  ) {}

  static empty(): NeuronsData {
    return new NeuronsData([], 0);
  }

  serialize(): NeuronsDataRaw {
    return {
      neurons: JSON.stringify(this.fullNeurons, bigIntReplacer),
      lastUpdated: this.lastUpdatedMSecs,
    };
  }

  static deserialize(raw: NeuronsDataRaw): NeuronsData {
    // Corrupt persisted neuron data must not crash account (de)serialization — fall back to an empty
    // snapshot, which the next device-signed list_neurons refresh repopulates.
    let fullNeurons: ICPNeuron[] = [];
    if (raw.neurons) {
      try {
        const parsed = JSON.parse(raw.neurons, bigIntReviver);
        if (Array.isArray(parsed)) fullNeurons = parsed;
      } catch {
        fullNeurons = [];
      }
    }
    const lastUpdated = Number.isFinite(raw.lastUpdated) ? raw.lastUpdated : 0;
    return new NeuronsData(fullNeurons, lastUpdated);
  }
}
