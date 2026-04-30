/**
 * Mappers from SUI GraphQL `MoveValue.json` payloads back to the JSON-RPC
 * data shapes the rest of `coin-sui` already consumes. Keeping the
 * adaptation isolated here means the dual-path code in `sdk.ts` only has
 * to dispatch, not also reshape.
 *
 * Two big targets:
 *
 *  1. `SuiSystemStateInnerV2` Move struct  →  JSON-RPC's
 *     `SuiValidatorSummary[]` (under `activeValidators`). Every consumer
 *     surface in coin-sui is the existing JSON-RPC shape; downstream
 *     code (logic/getValidators, preload-data, etc.) is unchanged.
 *
 *  2. `StakedSui` Move struct  →  JSON-RPC's `DelegatedStake[]` (each
 *     entry groups all of an account's stakes in a single staking pool).
 *
 * Field name conversion is consistently snake_case → camelCase, with
 * numeric Move values stringified to match JSON-RPC (which always uses
 * stringified BigInts to dodge u53 overflow).
 *
 * Limitations called out in the SDK migration plan (PR 1b):
 *   - `StakeObject.estimatedReward` is set to `"0"` for Active stakes.
 *     Computing the real value requires walking the pool's
 *     `exchange_rates` Move Table (one dynamic-field lookup per stake).
 *     Tracked as a follow-up — principal display is unaffected.
 */
import type { DelegatedStake, StakeObject, SuiValidatorSummary } from "@mysten/sui/jsonRpc";

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

/**
 * Subset of `SuiSystemStateInnerV2` we use. Other top-level fields
 * (storage_fund, parameters, stake_subsidy, …) are present in the JSON
 * but unused — the type intentionally omits them so the surface stays
 * small and reviewable.
 */
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

// ----- Helpers ------------------------------------------------------------

const s = (v: string | number | null | undefined): string =>
  v == null ? "" : typeof v === "number" ? String(v) : v;
const sOrNull = (v: string | number | null | undefined): string | null =>
  v == null ? null : typeof v === "number" ? String(v) : v;

/**
 * Convert a SUI Move type tag from the long padded form returned by GraphQL
 * to the short form returned by JSON-RPC.
 *
 *   long  → `0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI`
 *   short → `0x2::sui::SUI`
 *
 * `coin-sui` compares against the JSON-RPC convention everywhere
 * (`DEFAULT_COIN_TYPE = "0x2::sui::SUI"`), so the GraphQL transport
 * normalises down to the short form for parity.
 */
export function shortenCoinType(coinType: string): string {
  const m = /^0x([0-9a-fA-F]{1,64})(::.*)$/.exec(coinType);
  if (!m) return coinType;
  // Strip leading zeros, but always keep at least one character so the
  // SUI native coin type comes out as `0x2`, not `0x` or `0x0`.
  const trimmed = m[1].replace(/^0+/, "") || "0";
  return `0x${trimmed}${m[2]}`;
}

// ----- SystemState → SuiValidatorSummary[] --------------------------------

/**
 * Map one `Validator` Move struct to JSON-RPC's `SuiValidatorSummary`.
 * Field-by-field conversion, snake_case → camelCase, numbers → strings.
 */
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

/**
 * Convert the full SuiSystemStateInnerV2 JSON to:
 *   - the JSON-RPC-shaped active-validators array
 *   - a pool_id → validator_address map for stake-grouping
 */
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

// ----- Pool exchange-rate math (PR 1c) ------------------------------------

/** A single entry in a pool's `exchange_rates` Move Table. */
export type ExchangeRate = {
  sui_amount: string | number;
  pool_token_amount: string | number;
};

/**
 * Compute the unrealised reward for an Active stake.
 *
 * Pool-token model:
 *   When a user stakes `principal` SUI at activation epoch E_a, they
 *   receive `pool_tokens = principal × pt_a / sui_a` pool tokens, where
 *   (sui_a, pt_a) is the pool's exchange rate at E_a.
 *
 *   At the current epoch E_c with rate (sui_c, pt_c), those same pool
 *   tokens are now worth `pool_tokens × sui_c / pt_c` SUI.
 *
 *   `reward = max(0, current_value − principal)`.
 *
 * The clamp at 0 accounts for rounding — for stakes activated very
 * recently, `current_value` can be off by a few μSUI vs `principal`
 * because of integer division.
 */
export function computeEstimatedReward(
  principal: string | number | bigint,
  activationRate: ExchangeRate,
  currentRate: ExchangeRate,
): bigint {
  const p = typeof principal === "bigint" ? principal : BigInt(principal);
  const sui_a = BigInt(activationRate.sui_amount);
  const pt_a = BigInt(activationRate.pool_token_amount);
  const sui_c = BigInt(currentRate.sui_amount);
  const pt_c = BigInt(currentRate.pool_token_amount);
  if (sui_a === 0n || pt_c === 0n) return 0n;
  const tokens = (p * pt_a) / sui_a;
  const currentValue = (tokens * sui_c) / pt_c;
  return currentValue > p ? currentValue - p : 0n;
}

/**
 * Compute APY from a current and past pool exchange rate, mirroring the
 * formula Mysten's JSON-RPC `getValidatorsApy` uses internally:
 *
 *   per_epoch_growth = (current_ratio / past_ratio) ^ (1 / epochsBetween)
 *   APY              = per_epoch_growth ^ epochsPerYear − 1
 *
 * SUI epochs are ~24h, so `epochsPerYear ≈ 365`. Returns 0 when the inputs
 * are degenerate (zero division, zero or negative growth window).
 */
export function computeApy(
  currentRate: ExchangeRate,
  pastRate: ExchangeRate,
  epochsBetween: number,
  epochsPerYear = 365,
): number {
  if (epochsBetween <= 0) return 0;
  const past_sui = BigInt(pastRate.sui_amount);
  const past_pt = BigInt(pastRate.pool_token_amount);
  const cur_sui = BigInt(currentRate.sui_amount);
  const cur_pt = BigInt(currentRate.pool_token_amount);
  if (past_sui === 0n || past_pt === 0n || cur_pt === 0n) return 0;
  // Convert ratios to floats with 1e18 precision before the exponential —
  // BigInt math can't do non-integer exponents.
  const SCALE = 10n ** 18n;
  const pastRatioScaled = (past_sui * SCALE) / past_pt;
  const curRatioScaled = (cur_sui * SCALE) / cur_pt;
  if (pastRatioScaled === 0n) return 0;
  const ratio = Number(curRatioScaled) / Number(pastRatioScaled);
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  const perEpoch = Math.pow(ratio, 1 / epochsBetween);
  const apy = Math.pow(perEpoch, epochsPerYear) - 1;
  return Number.isFinite(apy) ? Math.max(apy, 0) : 0;
}

// ----- StakedSui[] → DelegatedStake[] -------------------------------------

const UNKNOWN_VALIDATOR = "<unknown>";

/**
 * Group a flat list of StakedSui JSON objects into the JSON-RPC
 * `DelegatedStake[]` shape — one entry per (validatorAddress, stakingPool).
 *
 * @param items     parsed `MoveValue.json` payloads from the StakedSuiObjects query
 * @param epoch     current epoch (number-or-string) — drives Active/Pending status
 * @param pools     pool_id → validator_address map from system state
 * @param rewards   optional `stakedSuiId → reward` map. When provided,
 *                  Active stakes use the real reward; when missing or
 *                  the entry is undefined, fall back to "0" (PR 1b
 *                  behaviour) so the function degrades gracefully if a
 *                  particular exchange-rate lookup failed.
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
    // SUI activates stakes one epoch after they're requested; preserve the
    // JSON-RPC convention that the request epoch precedes activation by 1.
    const stakeRequestEpoch = (stakeActiveEpoch - 1n).toString();
    const status: "Pending" | "Active" =
      stakeActiveEpoch > currentEpoch ? "Pending" : "Active";

    const reward = rewards?.get(item.id);
    const stake: StakeObject =
      status === "Pending"
        ? {
            stakedSuiId: item.id,
            stakeRequestEpoch,
            stakeActiveEpoch: s(item.stake_activation_epoch),
            principal: s(item.principal),
            status: "Pending",
          }
        : {
            stakedSuiId: item.id,
            stakeRequestEpoch,
            stakeActiveEpoch: s(item.stake_activation_epoch),
            principal: s(item.principal),
            status: "Active",
            estimatedReward: reward != null ? reward.toString() : "0",
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
 * Pool reference data needed to compute APY and per-stake rewards
 * client-side: the address of the exchange-rates Table, the current
 * exchange rate (read inline from system state), and the pool's
 * activation epoch (used as a fallback past epoch when the desired
 * APY-lookback predates the pool's existence).
 */
export type PoolRefs = {
  exchangeRatesId: string;
  currentRate: ExchangeRate;
  activationEpoch: number;
};

/**
 * Build a `pool_id → PoolRefs` map from a system-state JSON. The current
 * exchange rate is derived from `staking_pool.{sui_balance, pool_token_balance}`
 * which IS the pool's current rate — no extra query needed.
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
