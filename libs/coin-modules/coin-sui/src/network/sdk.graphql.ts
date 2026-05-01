import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import { CoinBalance, Checkpoint, DelegatedStake } from "@mysten/sui/jsonRpc";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import coinConfig from "../config";
import type { SuiValidator } from "../types";
import {
  BATCH_RATES_15,
  CHECKPOINT_BY_SEQUENCE,
  EXCHANGE_RATE_AT_EPOCH,
  LATEST_CHECKPOINT_SEQUENCE,
  STAKED_SUI_OBJECTS_BY_OWNER,
  SUI_SYSTEM_STATE,
  type StakedSuiObjectsResult,
  type SuiSystemStateResult,
} from "./graphql/queries";
import {
  assertSystemStateJson,
  fromSystemStateJson,
  groupStakedSuiByPool,
  isStakedSuiJson,
  type PoolRefs,
  poolRefsFromSystemState,
  shortenCoinType,
  type StakedSuiJson,
} from "./graphql/mappers";
import { computeApy, computeEstimatedReward, type ExchangeRate } from "./graphql/math";
import type { VariablesOf } from "./graphql/tada";
import {
  APY_LOOKBACK_EPOCHS,
  MAX_CURSOR_RETRIES,
  RATE_BATCH_CHUNK_SIZE,
  REQUEST_TIMEOUT_MS,
  STAKES_PAGE_SIZE,
} from "./graphql/constants";
import { inferNetworkFromUrl } from "./sdk";

type AsyncGraphQLApiFunction<T> = (api: SuiGraphQLClient) => Promise<T>;

type GenericInput<T> = T extends (...args: infer K) => unknown ? K : never;
type Inputs = GenericInput<typeof fetch>;

const fetcher = (url: Inputs[0], options: Inputs[1], retry = 3): Promise<Response> => {
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  if (options) {
    options.headers = {
      ...options.headers,
      "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
    };
  }

  // Per-attempt deadline (REQUEST_TIMEOUT_MS) is the only cancellation
  // path wired today — no Sui caller threads `signal` through yet, so
  // `options?.signal` is dead until one does. Recursion passes `options`
  // (not `opts`) so each retry gets a fresh controller; reusing `opts`
  // would race a stale/aborted signal.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts: RequestInit = {
    ...(options ?? {}),
    signal: options?.signal ?? controller.signal,
  };
  const finalize = (p: Promise<Response>): Promise<Response> =>
    p.finally(() => clearTimeout(timer));

  if (retry === 1) return finalize(fetch(url, opts));

  return finalize(fetch(url, opts).catch(() => fetcher(url, options, retry - 1)));
};

/**
 * Toggles `x-sui-rpc-show-usage` so responses carry `extensions.usage`
 * (input/output nodes, depth) for tuning against complexity caps. Off
 * by default (small server cost). Enable via `DEBUG_SUI_GRAPHQL`.
 */
function isGraphqlDebugEnabled(): boolean {
  // Read at call time so test env tweaks take effect without a rebuild.
  const v = (typeof process !== "undefined" && process.env?.DEBUG_SUI_GRAPHQL) || "";
  return v !== "" && v !== "0" && v.toLowerCase() !== "false";
}

/**
 * GraphQL wrapper over the shared retry-aware fetcher: stamps
 * `x-sui-rpc-request-id` logging and detects the `200 OK + errors[]`
 * failure shape.
 *
 * @internal Exported for the request-ID logging unit test only.
 */
export const graphqlFetcher = (url: Inputs[0], options: Inputs[1]): Promise<Response> => {
  const debug = isGraphqlDebugEnabled();
  const opts: RequestInit | undefined = debug
    ? {
        ...(options ?? {}),
        headers: {
          ...(options?.headers ?? {}),
          "x-sui-rpc-show-usage": "true",
        },
      }
    : options;
  return fetcher(url, opts).then(async res => {
    const requestId = res.headers.get("x-sui-rpc-request-id");
    if (!requestId) return res;

    // HTTP failure: log and pass through. Body may not be JSON.
    if (!res.ok) {
      log("coin:sui", "(network/sdk): GraphQL response", {
        url: String(url),
        status: res.status,
        requestId,
      });
      return res;
    }

    // 200 OK: parse, log any `errors[]`, stamp `__requestId` into the
    // body, and re-emit a real Response. Synchronous from the SDK's POV
    // — no microtask race between thrown error and request-ID log.
    const text = await res.text();
    let body: { errors?: { message?: string }[]; [k: string]: unknown };
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }
    if (body?.errors?.length) {
      log("coin:sui", "(network/sdk): GraphQL response with errors", {
        url: String(url),
        status: res.status,
        requestId,
        errorCount: body.errors.length,
        firstError: body.errors[0]?.message ?? "",
      });
    } else if (debug) {
      log("coin:sui", "(network/sdk): GraphQL response", {
        url: String(url),
        status: res.status,
        requestId,
      });
    }
    body.__requestId = requestId;
    return new Response(JSON.stringify(body), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  });
};

/** GraphQL counterpart of `withApi`; coexists until the JSON-RPC sunset on 2026-07-31. */
export async function withGraphQLApi<T>(
  execute: AsyncGraphQLApiFunction<T>,
  currencyId?: string,
): Promise<T> {
  const url = coinConfig.getCoinConfig(currencyId).node.url;
  const network = inferNetworkFromUrl(url) as
    | "mainnet"
    | "testnet"
    | "devnet"
    | "localnet"
    | "unknown";
  const api = new SuiGraphQLClient({
    url,
    network,
    fetch: graphqlFetcher as typeof fetch,
  });
  return execute(api);
}

/**
 * Envelope handler for `SuiGraphQLClient.query()`: throws on populated
 * `errors[]` (joined) or missing `data`. Centralised so every caller
 * emits all messages — pairs with the request-ID stamping above for
 * client↔server trace correlation.
 */
function unwrapGraphQL<T>(
  label: string,
  res: {
    data?: T | null;
    errors?: readonly { message: string }[] | null;
    /** Stamped by {@link graphqlFetcher} for trace correlation. */
    __requestId?: string;
  },
): T {
  const reqId = res.__requestId ? ` [reqId=${res.__requestId}]` : "";
  if (res.errors?.length) {
    const all = res.errors.map(e => e.message).join("; ");
    throw new Error(`GraphQL ${label} failed${reqId}: ${all}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`GraphQL ${label} returned no data${reqId}`);
  }
  return res.data;
}

/**
 * Unwrap a {@link SUI_SYSTEM_STATE} response and run the schema-drift
 * guard on its `MoveValue.json`. Centralised so every caller exits with
 * the same narrowed `stateJson` and a future site can't forget the
 * `assertSystemStateJson` boundary check.
 */
function unwrapAndValidateSystemState(
  systemRes: Parameters<typeof unwrapGraphQL<SuiSystemStateResult>>[1],
) {
  const data = unwrapGraphQL("SystemState", systemRes);
  const epoch = data.epoch;
  if (!epoch || !epoch.systemState?.json) {
    throw new Error("GraphQL SystemState returned no epoch payload");
  }
  const json = epoch.systemState.json;
  assertSystemStateJson(json);
  return { epoch, stateJson: json };
}

/** Permissive match for cursor-expiry errors — false positive only costs a restart-from-page-1 retry. */
function isCursorExpiredError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return /outside (?:the )?available range/i.test(e.message);
}

type CursorPage<T> = {
  items: ReadonlyArray<T>;
  endCursor: string | null;
  hasNextPage: boolean;
};

/**
 * Forward pagination with single drop-and-restart on cursor expiry.
 * `seed` lets a caller hand in a first page already fetched in parallel
 * (e.g. with system state); the seed is dropped on retry — it expired
 * with the cursor. Caller validates items AFTER this returns so retry
 * doesn't redo validation for pages it's about to discard.
 */
async function paginateWithCursorRecovery<T>(config: {
  source: string;
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>;
  /** Pre-fetched first page. `undefined` allowed (exactOptionalPropertyTypes). */
  seed?: CursorPage<T> | undefined;
  maxRetries?: number | undefined;
}): Promise<{ items: T[]; retries: number }> {
  const maxRetries = config.maxRetries ?? MAX_CURSOR_RETRIES;
  let totalRetries = 0;
  let useSeed = config.seed !== undefined;

  while (true) {
    const items: T[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    try {
      while (hasMore) {
        let page: CursorPage<T>;
        if (useSeed && config.seed) {
          page = config.seed;
          useSeed = false;
        } else {
          page = await config.fetchPage(cursor);
        }
        items.push(...page.items);
        cursor = page.endCursor;
        hasMore = page.hasNextPage && cursor !== null;
      }
      return { items, retries: totalRetries };
    } catch (e) {
      if (totalRetries < maxRetries && isCursorExpiredError(e)) {
        totalRetries++;
        log("warn", "sui-graphql:cursor-expired", {
          source: config.source,
          retry: totalRetries,
        });
        useSeed = false; // seed is captured at the original timestamp; also expired
        continue; // outer-loop restart resets `items`, `cursor`, `hasMore`
      }
      throw e;
    }
  }
}

/** Sequence numbers fit in UInt53 (≤16 digits); digests are base58, ~44 chars. */
export function isSequenceNumber(id: string): boolean {
  return id.length > 0 && id.length <= 16 && /^\d+$/.test(id);
}

// ============================================================================
// Stakes pipeline
// ============================================================================

type StakeNode = NonNullable<
  NonNullable<NonNullable<StakedSuiObjectsResult["address"]>["objects"]>["nodes"]
>[number];

type RatePlan = {
  stakedSuiId: string;
  principal: string | number;
  poolId: string;
  activationEpoch: string | number;
};

type StakeRatePlans = {
  activeStakes: RatePlan[];
  /** Deduped (table, epoch) lookups; index aligns with `fetchActivationRates` output. */
  wantedEntries: Array<{ key: string; table: string; epoch: string | number }>;
};

const rateKey = (table: string, epoch: string | number) => `${table}@${epoch}`;

/**
 * Parallel fetch of system state + first stakes page, with drift guard.
 * Returns the seed page so the pagination helper can skip a round-trip
 * on the happy path.
 */
async function fetchSystemStateAndStakesPage(
  api: SuiGraphQLClient,
  ownerAddr: string,
): Promise<{
  currentEpoch: bigint;
  epochId: string | number;
  poolToValidator: Map<string, string>;
  poolRefs: Map<string, PoolRefs>;
  seedPage: CursorPage<StakeNode> | undefined;
}> {
  const [systemRes, stakesRes] = await Promise.all([
    api.query({ query: SUI_SYSTEM_STATE }),
    api.query({
      query: STAKED_SUI_OBJECTS_BY_OWNER,
      variables: { owner: ownerAddr, first: STAKES_PAGE_SIZE, after: null },
    }),
  ]);
  const { epoch, stateJson } = unwrapAndValidateSystemState(systemRes);
  const stakesData = unwrapGraphQL("StakedSuiObjects", stakesRes);
  const { poolToValidator } = fromSystemStateJson(stateJson);
  const poolRefs = poolRefsFromSystemState(stateJson);
  const initialObjs = stakesData.address?.objects;
  const seedPage: CursorPage<StakeNode> | undefined = initialObjs
    ? {
        items: initialObjs.nodes ?? [],
        endCursor: initialObjs.pageInfo.endCursor ?? null,
        hasNextPage: initialObjs.pageInfo.hasNextPage,
      }
    : undefined;
  return {
    currentEpoch: BigInt(epoch.epochId),
    epochId: epoch.epochId,
    poolToValidator,
    poolRefs,
    seedPage,
  };
}

/** Page size 50 matches server default + JSON-RPC chunking. */
async function paginateRemainingStakes(
  api: SuiGraphQLClient,
  ownerAddr: string,
  seed: CursorPage<StakeNode> | undefined,
): Promise<StakeNode[]> {
  const { items } = await paginateWithCursorRecovery<StakeNode>({
    source: "stakes",
    seed,
    fetchPage: async cursor => {
      const res = await api.query({
        query: STAKED_SUI_OBJECTS_BY_OWNER,
        variables: { owner: ownerAddr, first: STAKES_PAGE_SIZE, after: cursor },
      });
      const objs = unwrapGraphQL("StakedSuiObjects (page)", res).address?.objects;
      return {
        items: objs?.nodes ?? [],
        endCursor: objs?.pageInfo.endCursor ?? null,
        hasNextPage: objs?.pageInfo.hasNextPage ?? false,
      };
    },
  });
  return items;
}

/** Split nodes into validated `StakedSuiJson` and a malformed-count. */
function validateStakedSuiNodes(rawNodes: ReadonlyArray<StakeNode>): {
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
function planActivationRateLookups(
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

/**
 * Batched activation-rate fetch. Per-chunk failures and missing rates
 * surface via the `sui-graphql:rate-fetch-degraded` telemetry channel
 * so a Mysten dynamic-field grammar change is visible before it shows
 * up as support tickets.
 */
async function fetchActivationRates(
  api: SuiGraphQLClient,
  plans: StakeRatePlans,
  malformed: number,
): Promise<Map<string, ExchangeRate | null>> {
  const { rates: rateArr, chunksFailed } = await fetchExchangeRatesBatched(
    api,
    plans.wantedEntries.map(({ table, epoch }) => ({ exchangeRatesId: table, epoch })),
    RATE_BATCH_CHUNK_SIZE,
  );
  const rates = new Map<string, ExchangeRate | null>();
  let missing = 0;
  plans.wantedEntries.forEach(({ key }, idx) => {
    const rate = rateArr[idx] ?? null;
    rates.set(key, rate);
    if (rate === null) missing++;
  });
  if (chunksFailed > 0 || missing > 0 || malformed > 0) {
    log("warn", "sui-graphql:rate-fetch-degraded", {
      source: "stakes-reward",
      chunksFailed,
      missing,
      malformed,
      total: plans.wantedEntries.length,
    });
  }
  return rates;
}

/** Apply the pool-token model to each Active stake; orphans skip silently. */
function computeStakeRewards(
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

// ============================================================================
// Exchange-rate dynamic-field lookups
// ============================================================================

/** Shape returned by `address.dynamicField(...).value` — single + batched lookups. */
type ExchangeRateAddrNode = {
  dynamicField?: {
    value?: { __typename?: string; json?: unknown } | null;
  } | null;
} | null;

/** Mirrors `isStakedSuiJson` in `mappers.ts` — predicate over `unknown`, no casts. */
function isExchangeRateJson(x: unknown): x is ExchangeRate {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    (typeof o.sui_amount === "string" || typeof o.sui_amount === "number") &&
    (typeof o.pool_token_amount === "string" || typeof o.pool_token_amount === "number")
  );
}

/** Project an `address.dynamicField` payload to an `ExchangeRate` or null. */
function parseExchangeRateNode(node: ExchangeRateAddrNode): ExchangeRate | null {
  if (!node) return null;
  const value = node.dynamicField?.value;
  if (!value || value.__typename !== "MoveValue") return null;
  if (!isExchangeRateJson(value.json)) return null;
  return { sui_amount: value.json.sui_amount, pool_token_amount: value.json.pool_token_amount };
}

/**
 * One entry from a pool's `exchange_rates` Move Table. `null` when the
 * table has no entry at that epoch; errors propagate so the caller can
 * decide whether to abort or degrade.
 */
async function fetchExchangeRate(
  api: SuiGraphQLClient,
  exchangeRatesId: string,
  epoch: number | string,
): Promise<ExchangeRate | null> {
  const res = await api.query({
    query: EXCHANGE_RATE_AT_EPOCH,
    variables: { table: exchangeRatesId, literal: `${epoch}u64` },
  });
  return parseExchangeRateNode(unwrapGraphQL(`ExchangeRate(${epoch})`, res).address ?? null);
}

/**
 * Batched variant of {@link fetchExchangeRate}: 1:1 output with `plans`,
 * `null` for missing entries, transport failures surface via `chunksFailed`.
 */
async function fetchExchangeRatesBatched(
  api: SuiGraphQLClient,
  plans: ReadonlyArray<{ exchangeRatesId: string; epoch: number | string }>,
  chunkSize: number,
): Promise<{ rates: Array<ExchangeRate | null>; chunksFailed: number }> {
  if (plans.length === 0) return { rates: [], chunksFailed: 0 };
  const safeChunk = Math.max(1, Math.floor(chunkSize));
  const chunks: Array<typeof plans> = [];
  for (let i = 0; i < plans.length; i += safeChunk) {
    chunks.push(plans.slice(i, i + safeChunk));
  }
  // `allSettled` so one chunk's failure doesn't tank the rest — failed
  // chunks degrade to `null`s; caller surfaces `chunksFailed`.
  const settled = await Promise.allSettled(
    chunks.map(chunk => fetchRateChunk(api, chunk, safeChunk)),
  );
  const rates: Array<ExchangeRate | null> = [];
  let chunksFailed = 0;
  settled.forEach((res, idx) => {
    if (res.status === "fulfilled") {
      rates.push(...res.value);
    } else {
      // Pad with `null`s so output stays 1:1 with input order.
      chunksFailed++;
      for (let i = 0; i < chunks[idx].length; i++) rates.push(null);
    }
  });
  return { rates, chunksFailed };
}

/**
 * Fetch one chunk of rates. Full-size chunks ride the static
 * {@link BATCH_RATES_15} aliased document (compile-time validated by
 * gql.tada); shorter tail chunks fall back to parallel single-query
 * {@link fetchExchangeRate} calls.
 */
async function fetchRateChunk(
  api: SuiGraphQLClient,
  plans: ReadonlyArray<{ exchangeRatesId: string; epoch: number | string }>,
  fullChunkSize: number,
): Promise<Array<ExchangeRate | null>> {
  if (plans.length < fullChunkSize) {
    return Promise.all(plans.map(p => fetchExchangeRate(api, p.exchangeRatesId, p.epoch)));
  }
  const variables = Object.fromEntries(
    plans.flatMap((p, i) => [
      [`t${i}`, p.exchangeRatesId],
      [`l${i}`, `${p.epoch}u64`],
    ]),
  ) as VariablesOf<typeof BATCH_RATES_15>;
  const res = await api.query({ query: BATCH_RATES_15, variables });
  const d = unwrapGraphQL("BatchExchangeRates", res);
  // Explicit alias list — keeps `parseExchangeRateNode` calls fully typed
  // off `ResultOf<typeof BATCH_RATES_15>`, no `keyof` lookup gymnastics.
  const aliases = [
    d.v0,
    d.v1,
    d.v2,
    d.v3,
    d.v4,
    d.v5,
    d.v6,
    d.v7,
    d.v8,
    d.v9,
    d.v10,
    d.v11,
    d.v12,
    d.v13,
    d.v14,
  ];
  return plans.map((_, i) => parseExchangeRateNode(aliases[i] ?? null));
}

// ============================================================================
// Checkpoint
// ============================================================================

/**
 * GraphQL checkpoint by sequence number, remapped to the JSON-RPC
 * `Checkpoint` subset. UInt53 only — callers must guard against digest
 * IDs (see `getCheckpoint` dispatcher).
 */
async function fetchCheckpointFromGraphQL(
  api: SuiGraphQLClient,
  sequenceNumber: string | number,
): Promise<{ digest: string; sequenceNumber: string; timestampMs: string }> {
  // UInt53 is a JSON number both directions; server rejects quoted strings.
  const seq = typeof sequenceNumber === "number" ? sequenceNumber : Number(sequenceNumber);
  const res = await api.query({
    query: CHECKPOINT_BY_SEQUENCE,
    variables: { sequenceNumber: seq },
  });
  const cp = unwrapGraphQL("CheckpointBySequence", res).checkpoint;
  if (!cp) {
    throw new Error(`GraphQL checkpoint not found: ${sequenceNumber}`);
  }
  // RFC3339 → epoch-ms string (JSON-RPC convention).
  const timestampMs = cp.timestamp ? String(new Date(cp.timestamp).getTime()) : "0";
  return {
    digest: cp.digest ?? "",
    sequenceNumber: String(cp.sequenceNumber),
    timestampMs,
  };
}

// ============================================================================
// Public per-function GraphQL handlers (passed to `withTransport` from sdk.ts)
// ============================================================================

/**
 * Cached `Address.balances` (post-SIP-58 surfaces `fundsInAddressBalance`).
 * Paginates `BalanceConnection` and remaps each node into `CoinBalance`.
 * JSON-RPC-only fields with no GraphQL equivalent (`coinObjectCount`,
 * `lockedBalance`) are filled with neutral defaults — verified unused by
 * callers.
 */
export const getAllBalancesCachedGraphQL = async (
  api: SuiGraphQLClient,
  owner: string,
): Promise<CoinBalance[]> => {
  // GraphQL's `SuiAddress!` requires the canonical 32-byte form;
  // JSON-RPC was tolerant. Normalise once at the boundary.
  const ownerAddr = normalizeSuiAddress(owner);
  const { items } = await paginateWithCursorRecovery<CoinBalance>({
    source: "balances",
    fetchPage: async cursor => {
      const res = await api.listBalances({ owner: ownerAddr, cursor });
      return {
        items: res.balances.map(b => ({
          // long → short coin type; consumers compare against `DEFAULT_COIN_TYPE`.
          coinType: shortenCoinType(b.coinType),
          coinObjectCount: 0,
          totalBalance: b.balance,
          lockedBalance: {},
          fundsInAddressBalance: b.addressBalance,
        })),
        endCursor: res.cursor,
        hasNextPage: res.hasNextPage,
      };
    },
  });
  return items;
};

/**
 * `DelegatedStake[]` reconstructed from `StakedSui` objects + system-state
 * (one extra dynamicField per Active stake, deduped); rate failures degrade
 * `estimatedReward` to `"0"`.
 */
export const getStakesRawGraphQL = async (
  api: SuiGraphQLClient,
  owner: string,
): Promise<DelegatedStake[]> => {
  // Canonicalise once — GraphQL `SuiAddress!` rejects short forms.
  const ownerAddr = normalizeSuiAddress(owner);
  const sys = await fetchSystemStateAndStakesPage(api, ownerAddr);
  const rawNodes = await paginateRemainingStakes(api, ownerAddr, sys.seedPage);
  const { items, malformed } = validateStakedSuiNodes(rawNodes);
  const plans = planActivationRateLookups(items, sys.currentEpoch, sys.poolRefs);
  const rates = await fetchActivationRates(api, plans, malformed);
  const rewards = computeStakeRewards(plans.activeStakes, sys.poolRefs, rates);
  return groupStakedSuiByPool(items, sys.epochId, sys.poolToValidator, rewards);
};

/**
 * Latest checkpoint via `LATEST_CHECKPOINT_SEQUENCE` + `CHECKPOINT_BY_SEQUENCE`.
 * Returns the JSON-RPC `Checkpoint` subset shape.
 */
export const getLastBlockGraphQL = async (
  api: SuiGraphQLClient,
): Promise<{ digest: string; sequenceNumber: string; timestampMs: string }> => {
  const res = await api.query({ query: LATEST_CHECKPOINT_SEQUENCE });
  const seq = unwrapGraphQL("LatestCheckpointSequence", res).checkpoint?.sequenceNumber;
  if (seq === null || seq === undefined) {
    throw new Error("GraphQL LatestCheckpointSequence returned no checkpoint");
  }
  return fetchCheckpointFromGraphQL(api, String(seq));
};

/**
 * Checkpoint by sequence number. The dispatcher is responsible for the
 * digest guard ({@link isSequenceNumber}) — GraphQL's
 * `Query.checkpoint(sequenceNumber:)` only accepts UInt53.
 */
export const getCheckpointGraphQL = (
  api: SuiGraphQLClient,
  id: string,
): Promise<Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">> =>
  fetchCheckpointFromGraphQL(api, id);

/**
 * Active validator set with APY. One `epoch.systemState.json` plus a
 * batched aliased exchange-rate query (one round-trip for ~127 validators).
 * APY is computed client-side from pool exchange-rate growth over
 * {@link APY_LOOKBACK_EPOCHS} (mirroring Mysten's formula). Pools younger
 * than the window clamp to their activation epoch; per-rate nulls degrade
 * to apy=0 and surface via telemetry.
 */
export const getValidatorsGraphQL = async (api: SuiGraphQLClient): Promise<SuiValidator[]> => {
  const res = await api.query({ query: SUI_SYSTEM_STATE });
  const { epoch, stateJson } = unwrapAndValidateSystemState(res);
  const { activeValidators } = fromSystemStateJson(stateJson);
  const poolRefs = poolRefsFromSystemState(stateJson);
  const currentEpoch = Number(epoch.epochId);

  // Plan one historical exchange-rate fetch per validator pool.
  type ApyPlan = {
    suiAddress: string;
    exchangeRatesId: string;
    currentRate: ExchangeRate;
    pastEpoch: number;
  };
  const plans: ApyPlan[] = [];
  for (const v of activeValidators) {
    const refs = poolRefs.get(v.stakingPoolId);
    if (!refs) continue;
    // 30-epoch lookback; clamp to activation epoch for young pools.
    const desired = currentEpoch - APY_LOOKBACK_EPOCHS;
    const pastEpoch = Math.max(desired, refs.activationEpoch);
    plans.push({
      suiAddress: v.suiAddress,
      exchangeRatesId: refs.exchangeRatesId,
      currentRate: refs.currentRate,
      pastEpoch,
    });
  }

  // Per-chunk failures and missing rates both degrade to apy=0.
  const { rates, chunksFailed } = await fetchExchangeRatesBatched(
    api,
    plans.map(p => ({ exchangeRatesId: p.exchangeRatesId, epoch: p.pastEpoch })),
    RATE_BATCH_CHUNK_SIZE,
  );

  const apyByAddress = new Map<string, number>();
  let rateMissing = 0;
  plans.forEach((p, idx) => {
    const rate = rates[idx];
    if (rate === null || rate === undefined) {
      rateMissing++;
      return; // degrade to 0
    }
    const epochsBetween = currentEpoch - p.pastEpoch;
    apyByAddress.set(p.suiAddress, computeApy(p.currentRate, rate, epochsBetween));
  });
  // Surface aggregate degradation; alert if many validators drop
  // to apy=0 (typical cause: dynamicField schema change).
  if (rateMissing > 0 || chunksFailed > 0) {
    log("warn", "sui-graphql:rate-fetch-degraded", {
      source: "validator-apy",
      missing: rateMissing,
      chunksFailed,
      total: plans.length,
    });
  }

  return activeValidators.map(v => ({ ...v, apy: apyByAddress.get(v.suiAddress) ?? 0 }));
};
