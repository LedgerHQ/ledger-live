/**
 * Adapt SUI GraphQL `MoveValue.json` payloads to the existing JSON-RPC
 * shapes so `sdk.ts` only has to dispatch, not also reshape:
 *   `SuiSystemStateInnerV2` → `SuiValidatorSummary[]`
 *   `StakedSui[]`           → `DelegatedStake[]`
 * snake_case → camelCase; numeric Move values are stringified to match
 * JSON-RPC's u64-as-string convention.
 */
import type { DelegatedStake, StakeObject, SuiValidatorSummary } from "@mysten/sui/jsonRpc";
import type { ExchangeRate } from "./math";

// ----- JSON shape coming out of `MoveValue.json` --------------------------

/** Subset of `0x3::staking_pool::StakedSui` Move struct fields we read. */
export type StakedSuiJson = {
  id: string;
  pool_id: string;
  stake_activation_epoch: string | number;
  principal: string | number;
};

type ValidatorMetadataJson = {
  sui_address: string;
  protocol_pubkey_bytes: string;
  network_pubkey_bytes: string;
  worker_pubkey_bytes: string;
  proof_of_possession: string;
  name: string;
  description: string;
  image_url: string;
  project_url: string;
  net_address: string;
  p2p_address: string;
  primary_address: string;
  worker_address: string;
  next_epoch_protocol_pubkey_bytes?: string | null;
  next_epoch_proof_of_possession?: string | null;
  next_epoch_network_pubkey_bytes?: string | null;
  next_epoch_worker_pubkey_bytes?: string | null;
  next_epoch_net_address?: string | null;
  next_epoch_p2p_address?: string | null;
  next_epoch_primary_address?: string | null;
  next_epoch_worker_address?: string | null;
};

type StakingPoolJson = {
  id: string;
  activation_epoch: string | number | null;
  deactivation_epoch: string | number | null;
  sui_balance: string | number;
  rewards_pool: string | number;
  pool_token_balance: string | number;
  exchange_rates: { id: string; size: string | number };
  pending_stake: string | number;
  pending_total_sui_withdraw: string | number;
  pending_pool_token_withdraw: string | number;
};

type ValidatorJson = {
  metadata: ValidatorMetadataJson;
  voting_power: string | number;
  operation_cap_id: string;
  gas_price: string | number;
  staking_pool: StakingPoolJson;
  commission_rate: string | number;
  next_epoch_stake: string | number;
  next_epoch_gas_price: string | number;
  next_epoch_commission_rate: string | number;
};

/** Subset we read; other top-level fields (storage_fund, parameters, …) are omitted. */
export type SuiSystemStateInnerJson = {
  epoch: string | number;
  protocol_version: string | number;
  system_state_version: string | number;
  validators: {
    active_validators: ValidatorJson[];
    total_stake: string | number;
    pending_active_validators: unknown;
    pending_removals: unknown;
    staking_pool_mappings: { id: string; size: string | number };
    inactive_validators: unknown;
    validator_candidates: unknown;
    at_risk_validators: unknown;
  };
  reference_gas_price: string | number;
  epoch_start_timestamp_ms: string | number;
};

// ----- Runtime guards -----------------------------------------------------

function ensureObject(x: unknown, name: string): Record<string, unknown> {
  if (typeof x !== "object" || x === null) {
    throw new Error(`${name} is not an object — GraphQL schema may have drifted.`);
  }
  return x as Record<string, unknown>;
}

/**
 * Drift guard at the `MoveValue.json` boundary — checks the top-level
 * shape and the `active_validators` array we iterate. Throws with a
 * descriptive error rather than letting `undefined` propagate into the
 * field mappers. Deep validation isn't worthwhile: per-field mappers
 * will fail loudly on missing nested fields anyway.
 */
export function assertSystemStateJson(x: unknown): asserts x is SuiSystemStateInnerJson {
  const root = ensureObject(x, "SuiSystemState payload");
  const validators = ensureObject(root.validators, "SuiSystemState.validators");
  if (!Array.isArray(validators.active_validators)) {
    throw new Error(
      "SuiSystemState.validators.active_validators is not an array — GraphQL schema may have drifted.",
    );
  }
}

/**
 * Predicate (not throw) so the caller can skip a malformed entry
 * without tanking the whole stake list. Production telemetry should
 * track the skip count if this ever fires.
 */
export function isStakedSuiJson(x: unknown): x is StakedSuiJson {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.pool_id === "string" &&
    (typeof obj.principal === "string" || typeof obj.principal === "number") &&
    (typeof obj.stake_activation_epoch === "string" ||
      typeof obj.stake_activation_epoch === "number")
  );
}

// ----- Helpers ------------------------------------------------------------

const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;
const s = (v: string | number | null | undefined): string =>
  isNullish(v) ? "" : typeof v === "number" ? String(v) : v;
const sOrNull = (v: string | number | null | undefined): string | null =>
  isNullish(v) ? null : typeof v === "number" ? String(v) : v;

/**
 * Normalise Move type tags from GraphQL's long padded form
 * (`0x000…002::sui::SUI`) to the JSON-RPC short form (`0x2::sui::SUI`).
 * coin-sui compares against `DEFAULT_COIN_TYPE = "0x2::sui::SUI"`
 * everywhere, so any GraphQL response field carrying a Move type tag
 * MUST run through this — otherwise the long form silently misses
 * `=== DEFAULT_COIN_TYPE` checks.
 */
export function shortenCoinType(coinType: string): string {
  const m = /^0x([0-9a-fA-F]{1,64})(::.*)$/.exec(coinType);
  if (!m) return coinType;
  // Keep at least one digit so SUI native ends as `0x2`, not `0x`.
  const trimmed = m[1].replace(/^0+/, "") || "0";
  return `0x${trimmed}${m[2]}`;
}

// ----- SystemState → SuiValidatorSummary[] --------------------------------

function validatorJsonToSummary(v: ValidatorJson): SuiValidatorSummary {
  const m = v.metadata;
  const p = v.staking_pool;
  return {
    suiAddress: m.sui_address,
    protocolPubkeyBytes: m.protocol_pubkey_bytes,
    networkPubkeyBytes: m.network_pubkey_bytes,
    workerPubkeyBytes: m.worker_pubkey_bytes,
    proofOfPossessionBytes: m.proof_of_possession,
    operationCapId: v.operation_cap_id,
    name: m.name,
    description: m.description,
    imageUrl: m.image_url,
    projectUrl: m.project_url,
    netAddress: m.net_address,
    p2pAddress: m.p2p_address,
    primaryAddress: m.primary_address,
    workerAddress: m.worker_address,
    nextEpochProtocolPubkeyBytes: m.next_epoch_protocol_pubkey_bytes ?? null,
    nextEpochProofOfPossession: m.next_epoch_proof_of_possession ?? null,
    nextEpochNetworkPubkeyBytes: m.next_epoch_network_pubkey_bytes ?? null,
    nextEpochWorkerPubkeyBytes: m.next_epoch_worker_pubkey_bytes ?? null,
    nextEpochNetAddress: m.next_epoch_net_address ?? null,
    nextEpochP2pAddress: m.next_epoch_p2p_address ?? null,
    nextEpochPrimaryAddress: m.next_epoch_primary_address ?? null,
    nextEpochWorkerAddress: m.next_epoch_worker_address ?? null,
    votingPower: s(v.voting_power),
    gasPrice: s(v.gas_price),
    commissionRate: s(v.commission_rate),
    nextEpochStake: s(v.next_epoch_stake),
    nextEpochGasPrice: s(v.next_epoch_gas_price),
    nextEpochCommissionRate: s(v.next_epoch_commission_rate),
    stakingPoolId: p.id,
    stakingPoolActivationEpoch: sOrNull(p.activation_epoch),
    stakingPoolDeactivationEpoch: sOrNull(p.deactivation_epoch),
    stakingPoolSuiBalance: s(p.sui_balance),
    rewardsPool: s(p.rewards_pool),
    poolTokenBalance: s(p.pool_token_balance),
    exchangeRatesId: p.exchange_rates.id,
    exchangeRatesSize: s(p.exchange_rates.size),
    pendingStake: s(p.pending_stake),
    pendingTotalSuiWithdraw: s(p.pending_total_sui_withdraw),
    pendingPoolTokenWithdraw: s(p.pending_pool_token_withdraw),
  };
}

/** Active-validators array + pool_id → validator_address map for stake grouping. */
export function fromSystemStateJson(state: SuiSystemStateInnerJson): {
  activeValidators: SuiValidatorSummary[];
  poolToValidator: Map<string, string>;
} {
  const activeValidators = state.validators.active_validators.map(validatorJsonToSummary);
  const poolToValidator = new Map<string, string>();
  for (const v of state.validators.active_validators) {
    poolToValidator.set(v.staking_pool.id, v.metadata.sui_address);
  }
  return { activeValidators, poolToValidator };
}

// ----- StakedSui[] → DelegatedStake[] -------------------------------------

/**
 * Sentinel for stakes whose `pool_id` isn't in the active set (orphan
 * pool removed mid-epoch, or system-state response raced ahead of the
 * StakedSui list). Exported so consumers compare against the constant.
 */
export const UNKNOWN_VALIDATOR = "<unknown>";

/**
 * Group StakedSui JSON objects into `DelegatedStake[]` — one entry per
 * (validator, pool). `rewards` is optional: Active stakes whose entry
 * is missing fall back to `"0"`, so a partial exchange-rate failure
 * degrades gracefully.
 */
export function groupStakedSuiByPool(
  items: StakedSuiJson[],
  epoch: string | number,
  pools: Map<string, string>,
  rewards?: Map<string, bigint>,
): DelegatedStake[] {
  const currentEpoch = BigInt(epoch);
  const byPool = new Map<string, DelegatedStake>();

  for (const item of items) {
    const stakeActiveEpoch = BigInt(item.stake_activation_epoch);
    // JSON-RPC convention: requestEpoch = activeEpoch − 1.
    const base = {
      stakedSuiId: item.id,
      stakeRequestEpoch: (stakeActiveEpoch - 1n).toString(),
      stakeActiveEpoch: s(item.stake_activation_epoch),
      principal: s(item.principal),
    };
    const reward = rewards?.get(item.id);
    const stake: StakeObject =
      stakeActiveEpoch > currentEpoch
        ? { ...base, status: "Pending" }
        : {
            ...base,
            status: "Active",
            estimatedReward: reward !== undefined ? reward.toString() : "0",
          };

    let group = byPool.get(item.pool_id);
    if (!group) {
      group = {
        validatorAddress: pools.get(item.pool_id) ?? UNKNOWN_VALIDATOR,
        stakingPool: item.pool_id,
        stakes: [],
      };
      byPool.set(item.pool_id, group);
    }
    group.stakes.push(stake);
  }

  return Array.from(byPool.values());
}

// ----- Pool current-rate map for stake reward + APY -----------------------

/**
 * Pool data for client-side APY + reward: the rates-table id, the
 * current rate (read inline from system state), and the pool's
 * activation epoch (fallback past epoch for young pools).
 */
export type PoolRefs = {
  exchangeRatesId: string;
  currentRate: ExchangeRate;
  activationEpoch: number;
};

/**
 * `pool_id → PoolRefs` from system-state. The current rate is
 * `staking_pool.{sui_balance, pool_token_balance}` — already in the
 * payload, no extra query.
 */
export function poolRefsFromSystemState(state: SuiSystemStateInnerJson): Map<string, PoolRefs> {
  const out = new Map<string, PoolRefs>();
  for (const v of state.validators.active_validators) {
    const p = v.staking_pool;
    out.set(p.id, {
      exchangeRatesId: p.exchange_rates.id,
      currentRate: {
        sui_amount: p.sui_balance,
        pool_token_amount: p.pool_token_balance,
      },
      activationEpoch: Number(p.activation_epoch ?? 0),
    });
  }
  return out;
}
