/** Pure helpers backing the GraphQL pipelines: shape adapters, drift guards, pool math, and predicates. */
import { log } from "@ledgerhq/logs";
import type { SuiClientTypes } from "@mysten/sui/client";
import type { DelegatedStake, StakeObject } from "@mysten/sui/jsonRpc";
import type { SuiValidatorSummary } from "../../types";
import type { StakedSuiObjectsResult } from "./queries";

/**
 * Envelope handler for `SuiGraphQLClient.query()`: throws on populated
 * `errors[]` (joined) or missing `data`. Shared between the read-side
 * (`sdk.graphql.ts`) and the build-side (`sui-client-adapter.ts`).
 *
 * Part 1 cleanup applied: removed `as NonNullable<T>` cast — TS narrows
 * `res.data` after the null/undefined guard on its own.
 */
export function unwrapGraphQL<T>(
  label: string,
  res: { data?: T | null; errors?: readonly { message: string }[] | null },
): NonNullable<T> {
  if (res.errors?.length) {
    throw new Error(`GraphQL ${label} failed: ${res.errors.map(e => e.message).join("; ")}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`GraphQL ${label} failed: no data`);
  }
  return res.data;
}

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
    stakingPoolId: v.staking_pool.id,
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

/**
 * APY mirroring Mysten's `getValidatorsApy`:
 *   APY = (cur_ratio / past_ratio) ^ (epochsPerYear / epochsBetween) − 1
 * SUI epochs ~24h → `epochsPerYear ≈ 365`. Returns 0 for degenerate inputs (zero division,
 * non-positive growth window). Precision is safe for the SUI rate range; see inline note below.
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
  // Bigint division throughout, with `RATIO_SCALE=10^9` retained on the
  // ratio numerator so the bigint→Number step lands at ~10^9 (well under
  // 2^53) instead of ~10^18 where pool-token magnitudes lose precision.
  const SCALE = 10n ** 18n;
  const pastRatioScaled = (past_sui * SCALE) / past_pt;
  const curRatioScaled = (cur_sui * SCALE) / cur_pt;
  if (pastRatioScaled === 0n) return 0;
  const RATIO_SCALE = 10n ** 9n;
  const ratioScaled = (curRatioScaled * RATIO_SCALE) / pastRatioScaled;
  const ratio = Number(ratioScaled) / Number(RATIO_SCALE);
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  const perEpoch = Math.pow(ratio, 1 / epochsBetween);
  const apy = Math.pow(perEpoch, epochsPerYear) - 1;
  return Number.isFinite(apy) ? Math.max(apy, 0) : 0;
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

// ----- Failure-error extraction from gRPC `ExecutionStatus` ---------------

function prettifyEnumKind(kind: string): string {
  return kind.toLowerCase().replace(/_+/g, " ").trim();
}

/**
 * Extract a human-readable error from the gRPC-proto `ExecutionStatus` shape carried in
 * `effectsJson`: prefer `description`, fall back to a prettified `kind` enum, then a generic placeholder.
 */
export function extractFailureError(effectsJson: Record<string, unknown>): string {
  const status = effectsJson.status;
  const err =
    status && typeof status === "object" && !Array.isArray(status)
      ? (status as Record<string, unknown>).error
      : undefined;
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const e = err as Record<string, unknown>;
    if (typeof e.description === "string" && e.description.length > 0) return e.description;
    if (typeof e.kind === "string" && e.kind.length > 0) return prettifyEnumKind(e.kind);
  }
  return "transaction execution failed";
}

// ----- OpenMoveType signature projection ----------------------------------

/**
 * GraphQL `OpenMoveTypeSignature` JSON-scalar shape — opaque structured value
 * the SDK's `Transaction.build` resolver reads via `getMoveFunction`. Body is
 * a tagged union: primitive string, vector wrapper, datatype struct, or type
 * parameter index.
 */
export type OpenMoveSigJson = {
  ref?: "&" | "&mut" | null;
  body: OpenMoveSigBodyJson;
};

export type OpenMoveSigBodyJson =
  | "address"
  | "bool"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "u128"
  | "u256"
  | { vector: OpenMoveSigBodyJson }
  | { typeParameter: number }
  | {
      datatype: {
        package: string;
        module: string;
        type: string;
        typeParameters: OpenMoveSigBodyJson[];
      };
    };

const PRIMITIVE_KINDS = ["address", "bool", "u8", "u16", "u32", "u64", "u128", "u256"] as const;
type PrimitiveKind = (typeof PRIMITIVE_KINDS)[number];

const isPrimitiveKind = (s: string): s is PrimitiveKind =>
  (PRIMITIVE_KINDS as readonly string[]).includes(s);

/** Recursive `OpenMoveSigBodyJson` → SDK `OpenSignatureBody` projection. */
export function projectOpenMoveBody(body: unknown): SuiClientTypes.OpenSignatureBody {
  if (typeof body === "string") {
    return isPrimitiveKind(body) ? { $kind: body } : { $kind: "unknown" };
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if ("vector" in obj) {
      return { $kind: "vector", vector: projectOpenMoveBody(obj.vector) };
    }
    if ("typeParameter" in obj) {
      return { $kind: "typeParameter", index: Number(obj.typeParameter) };
    }
    if ("datatype" in obj) {
      const dt = obj.datatype as {
        package: string;
        module: string;
        type: string;
        typeParameters?: unknown[];
      };
      return {
        $kind: "datatype",
        datatype: {
          typeName: `${dt.package}::${dt.module}::${dt.type}`,
          typeParameters: (dt.typeParameters ?? []).map(projectOpenMoveBody),
        },
      };
    }
  }
  return { $kind: "unknown" };
}

const moveRefToOpenSignatureReference = (
  ref: string | null | undefined,
): "mutable" | "immutable" | null => {
  if (ref === "&mut") return "mutable";
  if (ref === "&") return "immutable";
  return null;
};

/** GraphQL `parameters[i].signature` JSON scalar → SDK `OpenSignature`. */
export function projectOpenMoveSignature(sigJson: unknown): SuiClientTypes.OpenSignature {
  const sig = sigJson as OpenMoveSigJson;
  return {
    reference: moveRefToOpenSignatureReference(sig?.ref),
    body: projectOpenMoveBody(sig?.body),
  };
}
