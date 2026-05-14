/** Pure helpers backing the GraphQL pipelines: shape adapters, drift guards, pool math, and predicates. */
import { log } from "@ledgerhq/logs";
import type { DelegatedStake, StakeObject } from "@mysten/sui/jsonRpc";
import type { SuiValidatorSummary } from "../../types";
import type { StakedSuiObjectsResult } from "./queries";

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
  name: string;
  description: string;
  image_url: string;
  project_url: string;
};

type StakingPoolJson = {
  id: string;
  activation_epoch: string | number | null;
  sui_balance: string | number;
  pool_token_balance: string | number;
  exchange_rates: { id: string };
};

type ValidatorJson = {
  metadata: ValidatorMetadataJson;
  staking_pool: StakingPoolJson;
  commission_rate: string | number;
};

/** Narrowed to fields the mapper + drift guards + `poolRefsFromSystemState` actually read. */
export type SuiSystemStateInnerJson = {
  epoch: string | number;
  validators: { active_validators: ValidatorJson[] };
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
    throw new TypeError(
      "SuiSystemState.validators.active_validators is not an array — GraphQL schema may have drifted.",
    );
  }
}

/** Move u64 wire form (number or base-10 integer string); rejects anything BigInt() can't parse. */
function isU64Numeric(v: unknown): boolean {
  if (typeof v === "number") return Number.isInteger(v) && v >= 0;
  if (typeof v === "string") return /^\d+$/.test(v);
  return false;
}

/**
 * Predicate (not throw) so the caller can skip a malformed entry
 * without tanking the whole stake list. The skip count is surfaced
 * via `validateStakedSuiNodes`'s `malformed` and logged through
 * `sui-graphql:rate-fetch-degraded` in `sdk.graphql.ts`.
 */
export function isStakedSuiJson(x: unknown): x is StakedSuiJson {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.pool_id === "string" &&
    isU64Numeric(obj.principal) &&
    isU64Numeric(obj.stake_activation_epoch)
  );
}

// ----- Helpers ------------------------------------------------------------

/** Stringify a Move u64 wire value; nullish → `""`. */
const str = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  return typeof v === "number" ? String(v) : v;
};

/**
 * Normalise GraphQL's long padded Move type tags to JSON-RPC short form.
 * coin-sui compares against `DEFAULT_COIN_TYPE` everywhere; long forms
 * silently miss `===` checks if any GraphQL response skips this.
 */
export function shortenCoinType(coinType: string): string {
  const m = /^0x([0-9a-fA-F]{1,64})(::.*)$/.exec(coinType);
  if (!m) return coinType;
  // Keep at least one digit so the all-zero address normalises to `0x0`.
  const trimmed = m[1].replace(/^0+/, "") || "0";
  return `0x${trimmed}${m[2]}`;
}

// ----- SystemState → SuiValidatorSummary[] --------------------------------

function validatorJsonToSummary(v: ValidatorJson): SuiValidatorSummary {
  const m = v.metadata;
  return {
    suiAddress: m.sui_address,
    name: m.name,
    description: m.description,
    imageUrl: m.image_url,
    projectUrl: m.project_url,
    stakingPoolSuiBalance: str(v.staking_pool.sui_balance),
    commissionRate: str(v.commission_rate),
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

/** Sentinel for stakes whose `pool_id` isn't in the active set; exported for caller equality checks. */
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
  // One warn per orphan pool per call: a removed-mid-epoch pool can shadow
  // hundreds of stakes; deduping keeps the log line useful for triage.
  const warnedOrphans = new Set<string>();

  for (const item of items) {
    const stakeActiveEpoch = BigInt(item.stake_activation_epoch);
    // JSON-RPC convention: requestEpoch = activeEpoch − 1.
    const base = {
      stakedSuiId: item.id,
      stakeRequestEpoch: (stakeActiveEpoch - 1n).toString(),
      stakeActiveEpoch: str(item.stake_activation_epoch),
      principal: str(item.principal),
    };
    const reward = rewards?.get(item.id);
    const stake: StakeObject =
      stakeActiveEpoch > currentEpoch
        ? { ...base, status: "Pending" }
        : {
            ...base,
            status: "Active",
            estimatedReward: reward?.toString() ?? "0",
          };

    let group = byPool.get(item.pool_id);
    if (!group) {
      const validatorAddress = pools.get(item.pool_id);
      if (validatorAddress === undefined && !warnedOrphans.has(item.pool_id)) {
        warnedOrphans.add(item.pool_id);
        log("warn", "sui-graphql:orphan-pool", {
          poolId: item.pool_id,
          firstStakeId: item.id,
        });
      }
      group = {
        validatorAddress: validatorAddress ?? UNKNOWN_VALIDATOR,
        stakingPool: item.pool_id,
        stakes: [],
      };
      byPool.set(item.pool_id, group);
    }
    group.stakes.push(stake);
  }

  return Array.from(byPool.values());
}

// ----- Pool exchange-rate math --------------------------------------------

export type ExchangeRate = {
  sui_amount: string | number;
  pool_token_amount: string | number;
};

/**
 * Unrealised reward for an Active stake (pool-token model):
 *   tokens = principal × pt_a / sui_a
 *   value  = tokens × sui_c / pt_c
 *   reward = max(0, value − principal)
 * Clamp at 0 absorbs integer-division rounding for very-recent stakes.
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

// ----- Pool current-rate map for stake reward -----------------------------

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

// ----- Pipeline helpers (consumed by network/sdk.graphql.ts) --------------

/** One stake node from `STAKED_SUI_OBJECTS_BY_OWNER`'s paginated `nodes`. */
export type StakeNode = NonNullable<
  NonNullable<NonNullable<StakedSuiObjectsResult["address"]>["objects"]>["nodes"]
>[number];

export type RatePlan = {
  stakedSuiId: string;
  principal: string | number;
  poolId: string;
  activationEpoch: string | number;
};

export type StakeRatePlans = {
  activeStakes: RatePlan[];
  /** Deduped (table, epoch) lookups; index aligns with the rate-fetch output. */
  wantedEntries: Array<{ key: string; table: string; epoch: string | number }>;
};

/** Composite key for the activation-epoch rate cache. */
const rateKey = (table: string, epoch: string | number): string => `${table}@${epoch}`;

/** Split nodes into validated `StakedSuiJson` and a malformed-count. */
export function validateStakedSuiNodes(rawNodes: ReadonlyArray<StakeNode>): {
  items: StakedSuiJson[];
  malformed: number;
} {
  const items: StakedSuiJson[] = [];
  let malformed = 0;
  for (const node of rawNodes) {
    const json = node.contents?.json;
    if (isStakedSuiJson(json)) items.push(json);
    else if (json !== null && json !== undefined) malformed++;
  }
  return { items, malformed };
}

/**
 * Derive (a) the per-stake activation-rate plan and (b) deduped
 * (table, epoch) lookups. Orphan pools (not in the active set) are
 * excluded — their rewards stay `"0"`.
 */
export function planActivationRateLookups(
  items: ReadonlyArray<StakedSuiJson>,
  currentEpoch: bigint,
  poolRefs: Map<string, PoolRefs>,
): StakeRatePlans {
  const activeStakes: RatePlan[] = items
    .filter(it => BigInt(it.stake_activation_epoch) <= currentEpoch)
    .map(it => ({
      stakedSuiId: it.id,
      principal: it.principal,
      poolId: it.pool_id,
      activationEpoch: it.stake_activation_epoch,
    }));
  const wanted = new Map<string, { key: string; table: string; epoch: string | number }>();
  for (const plan of activeStakes) {
    const refs = poolRefs.get(plan.poolId);
    if (!refs) continue;
    const key = rateKey(refs.exchangeRatesId, plan.activationEpoch);
    if (!wanted.has(key)) {
      wanted.set(key, { key, table: refs.exchangeRatesId, epoch: plan.activationEpoch });
    }
  }
  return { activeStakes, wantedEntries: Array.from(wanted.values()) };
}

/** Apply the pool-token model to each Active stake; orphans skip silently. */
export function computeStakeRewards(
  activeStakes: ReadonlyArray<RatePlan>,
  poolRefs: Map<string, PoolRefs>,
  rates: Map<string, ExchangeRate | null>,
): Map<string, bigint> {
  const rewards = new Map<string, bigint>();
  for (const plan of activeStakes) {
    const refs = poolRefs.get(plan.poolId);
    if (!refs) continue;
    const activationRate = rates.get(rateKey(refs.exchangeRatesId, plan.activationEpoch));
    if (!activationRate) continue;
    rewards.set(
      plan.stakedSuiId,
      computeEstimatedReward(plan.principal, activationRate, refs.currentRate),
    );
  }
  return rewards;
}

// ----- Exchange-rate dynamic-field shape ----------------------------------

/** Shape returned by `address.dynamicField(...).value` — single + batched lookups. */
export type ExchangeRateAddrNode = {
  dynamicField?: {
    value?: { __typename?: string; json?: unknown } | null;
  } | null;
} | null;

/** Predicate over `unknown`, no casts. Mirrors {@link isStakedSuiJson}. */
function isExchangeRateJson(x: unknown): x is ExchangeRate {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  // Same strict u64 check as isStakedSuiJson; downstream BigInt() throws on bad strings.
  return isU64Numeric(o.sui_amount) && isU64Numeric(o.pool_token_amount);
}

/** Project an `address.dynamicField` payload to an `ExchangeRate` or null. */
export function parseExchangeRateNode(node: ExchangeRateAddrNode): ExchangeRate | null {
  if (!node) return null;
  const value = node.dynamicField?.value;
  if (value?.__typename !== "MoveValue") return null;
  if (!isExchangeRateJson(value.json)) return null;
  return { sui_amount: value.json.sui_amount, pool_token_amount: value.json.pool_token_amount };
}
