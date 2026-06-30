import { log } from "@ledgerhq/logs";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type {
  CoinBalance,
  Checkpoint,
  DelegatedStake,
  SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { normalizeSuiAddress, toBase64 } from "@mysten/sui/utils";
import { createSuiGraphQLClient, type SuiGraphQLClient } from "./graphql/client";
import coinConfig from "../config";
import type { SuiValidator } from "../types";
import { fetcher } from "./fetcher";
import {
  ALL_BALANCES_BY_OWNER,
  BATCH_RATES_15,
  BLOCK_BY_SEQUENCE,
  CHECKPOINT_BY_SEQUENCE,
  EXCHANGE_RATE_AT_EPOCH,
  EXECUTE_TRANSACTION,
  LATEST_CHECKPOINT_SEQUENCE,
  SIMULATE_TRANSACTION,
  STAKED_SUI_OBJECTS_BY_OWNER,
  SUI_SYSTEM_STATE,
  TRANSACTION_BY_DIGEST,
  TRANSACTIONS_BY_AFFECTED_ADDRESS,
  type SuiSystemStateResult,
} from "./graphql/queries";
import { graphqlTxToJsonRpcResponse, isFinalizedTxNode } from "./graphql/transactions";
import {
  assertSystemStateJson,
  computeApy,
  computeStakeRewards,
  extractFailureError,
  fromSystemStateJson,
  groupStakedSuiByPool,
  parseExchangeRateNode,
  planActivationRateLookups,
  poolRefsFromSystemState,
  shortenCoinType,
  unwrapGraphQL,
  validateStakedSuiNodes,
  type PoolRefs,
  type StakeNode,
  type StakeRatePlans,
  type SuiSystemStateInnerJson,
  type ExchangeRate,
} from "./graphql/utils";
import type { VariablesOf } from "./graphql/tada";
import {
  APY_LOOKBACK_EPOCHS,
  BLOCK_TXS_PAGE_SIZE,
  EVENTS_PAGE_SIZE,
  MAX_CURSOR_RETRIES,
  MAX_PAGES,
  RATE_BATCH_CHUNK_SIZE,
  RATE_CHUNK_CONCURRENCY,
  STAKES_PAGE_SIZE,
} from "./graphql/constants";

type Inputs = Parameters<typeof fetch>;

export type AsyncGraphQLApiFunction<T> = (api: SuiGraphQLClient) => Promise<T>;

/** `DEBUG_SUI_GRAPHQL` toggles `x-sui-rpc-show-usage` so responses carry `extensions.usage` for tuning. */
function isGraphqlDebugEnabled(): boolean {
  // Read at call time so test env tweaks take effect without a rebuild.
  const v = (typeof process !== "undefined" && process.env?.DEBUG_SUI_GRAPHQL) || "";
  return v !== "" && v !== "0" && v.toLowerCase() !== "false";
}

/**
 * `RequestInfo | URL` → log-friendly string. `String(Request)` yields the
 * useless default `[object Request]`; `URL.toString()` and bare strings are
 * already fine. Centralised so request-id logs always print a real URL.
 */
const urlForLog = (u: Inputs[0]): string => {
  if (typeof u === "string") return u;
  if (u instanceof URL) return u.toString();
  return u.url;
};

/**
 * GraphQL wrapper over the shared retry-aware fetcher: stamps `x-sui-rpc-request-id` logging
 * and detects the `200 OK + errors[]` failure shape.
 * @internal Exported for the request-ID logging unit test only.
 */
export const graphqlFetcher = (url: Inputs[0], options: Inputs[1]): Promise<Response> => {
  const debug = isGraphqlDebugEnabled();
  const opts: RequestInit | undefined = debug
    ? {
        ...options,
        headers: {
          ...options?.headers,
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
        url: urlForLog(url),
        status: res.status,
        requestId,
      });
      return res;
    }

    // 200 OK: parse, stamp `__requestId`, re-emit synchronously so the request-ID log can't race a thrown error.
    const text = await res.text();
    let body: { errors?: { message?: string }[]; [k: string]: unknown };
    try {
      body = JSON.parse(text);
    } catch {
      // The body was consumed via `res.text()` so content-encoding/content-length on the
      // original headers no longer describe what we're emitting — strip them.
      const cleaned = new Headers(res.headers);
      cleaned.delete("content-encoding");
      cleaned.delete("content-length");
      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers: cleaned,
      });
    }
    if (body?.errors?.length) {
      log("coin:sui", "(network/sdk): GraphQL response with errors", {
        url: urlForLog(url),
        status: res.status,
        requestId,
        errorCount: body.errors.length,
        firstError: body.errors[0]?.message ?? "",
      });
    } else if (debug) {
      log("coin:sui", "(network/sdk): GraphQL response", {
        url: urlForLog(url),
        status: res.status,
        requestId,
      });
    }
    body.__requestId = requestId;
    // Body has been decompressed and re-stringified — drop the upstream
    // content-encoding/length so middleware doesn't try to re-decode.
    const headers = new Headers(res.headers);
    const stripped = headers.get("content-encoding");
    headers.delete("content-encoding");
    headers.delete("content-length");
    if (debug && stripped) {
      log("coin:sui", "(network/sdk): GraphQL response stripped content-encoding", {
        encoding: stripped,
        requestId,
      });
    }
    return new Response(JSON.stringify(body), {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  });
};

export async function withGraphQLApi<T>(
  execute: AsyncGraphQLApiFunction<T>,
  currencyId?: string,
): Promise<T> {
  const url = coinConfig.getCoinConfig(currencyId).node.graphqlUrl;
  const api = createSuiGraphQLClient({ url, fetch: graphqlFetcher });
  return execute(api);
}

/** Centralised so every caller exits with the same narrowed `stateJson` and the drift guard can't be skipped. */
function unwrapAndValidateSystemState(
  systemRes: Parameters<typeof unwrapGraphQL<SuiSystemStateResult>>[1],
): { epoch: NonNullable<SuiSystemStateResult["epoch"]>; stateJson: SuiSystemStateInnerJson } {
  const data = unwrapGraphQL("SystemState", systemRes);
  const epoch = data.epoch;
  if (!epoch?.systemState?.json) {
    throw new Error("GraphQL SystemState failed: no epoch payload");
  }
  const json = epoch.systemState.json;
  try {
    assertSystemStateJson(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`GraphQL SystemState failed: ${msg}`);
  }
  return { epoch, stateJson: json };
}

type CursorPage<T> = {
  items: ReadonlyArray<T>;
  endCursor: string | null;
  hasNextPage: boolean;
};

/** True iff `e` looks like a server cursor-expiry error (permissive match). */
const isCursorExpired = (e: unknown): boolean =>
  e instanceof Error && /outside (?:the )?available range/i.test(e.message);

/** Single forward walk from `seed` (if any) until `hasNextPage === false`. */
async function walkPages<T>(
  source: string,
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>,
  seed: CursorPage<T> | undefined,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pages = 0;
  let next = seed;
  while (hasMore) {
    if (pages >= MAX_PAGES) {
      throw new Error(
        `paginateWithCursorRecovery(${source}): exceeded ${MAX_PAGES} pages — server hasNextPage may be misreporting.`,
      );
    }
    const page: CursorPage<T> = next ?? (await fetchPage(cursor));
    next = undefined;
    items.push(...page.items);
    cursor = page.endCursor;
    hasMore = page.hasNextPage && cursor !== null;
    pages++;
  }
  return items;
}

/**
 * Forward pagination with single drop-and-restart on cursor expiry.
 * `seed` (a pre-fetched first page) is dropped on retry along with the cursor.
 * Caller validates AFTER return so retry doesn't redo validation for pages it discards.
 */
async function paginateWithCursorRecovery<T>(config: {
  source: string;
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>;
  /** Pre-fetched first page. Omit (don't pass `undefined`) under exactOptionalPropertyTypes. */
  seed?: CursorPage<T>;
  maxRetries?: number;
}): Promise<{ items: T[]; retries: number }> {
  const maxRetries = config.maxRetries ?? MAX_CURSOR_RETRIES;

  // attempt 0 = initial walk; attempt 1..maxRetries = post-cursor-expiry restarts.
  // The seed is consumed on the first walk; expired retries restart from page 1.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const seed = attempt === 0 ? config.seed : undefined;
      const items = await walkPages(config.source, config.fetchPage, seed);
      return { items, retries: attempt };
    } catch (e) {
      if (attempt < maxRetries && isCursorExpired(e)) {
        log("warn", "sui-graphql:cursor-expired", {
          source: config.source,
          retry: attempt + 1,
        });
        continue;
      }
      throw e;
    }
  }
  // Unreachable: the loop body always returns or throws.
  throw new Error(`paginateWithCursorRecovery: exhausted ${maxRetries} retries without resolution`);
}

// ============================================================================
// Stakes pipeline
// ============================================================================

/** Parallel system-state + first-page fetch; seed lets pagination skip the happy-path round-trip. */
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
    ...(seed !== undefined && { seed }),
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

/** Per-chunk failures + missing rates surface via `sui-graphql:rate-fetch-degraded` for early drift signal. */
async function fetchActivationRates(
  api: SuiGraphQLClient,
  plans: StakeRatePlans,
  malformed: number,
): Promise<Map<string, ExchangeRate | null>> {
  const {
    rates: rateArr,
    chunksFailed,
    firstError,
  } = await fetchExchangeRatesBatched(
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
      ...(firstError !== undefined && { firstError }),
    });
  }
  return rates;
}

// ============================================================================
// Exchange-rate dynamic-field lookups
// ============================================================================

/** `null` when the rates table has no entry at that epoch; errors propagate for caller-side triage. */
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

/** Batched {@link fetchExchangeRate}: 1:1 output, `null` on miss, transport failures via `chunksFailed`/`firstError`. */
async function fetchExchangeRatesBatched(
  api: SuiGraphQLClient,
  plans: ReadonlyArray<{ exchangeRatesId: string; epoch: number | string }>,
  chunkSize: number,
): Promise<{ rates: Array<ExchangeRate | null>; chunksFailed: number; firstError?: string }> {
  if (plans.length === 0) return { rates: [], chunksFailed: 0 };
  const safeChunk = Math.max(1, Math.floor(chunkSize));
  const chunks: Array<typeof plans> = [];
  for (let i = 0; i < plans.length; i += safeChunk) {
    chunks.push(plans.slice(i, i + safeChunk));
  }
  // INVARIANT: each chunk's result length matches its input length — null-pad on failure preserves 1:1.
  const settled = await promiseAllBatched(RATE_CHUNK_CONCURRENCY, chunks, async chunk => {
    try {
      return { ok: true as const, value: await fetchRateChunk(api, chunk, safeChunk) };
    } catch (err) {
      return {
        ok: false as const,
        size: chunk.length,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  });
  const rates: Array<ExchangeRate | null> = [];
  let chunksFailed = 0;
  let firstError: string | undefined;
  for (const res of settled) {
    if (res.ok) {
      rates.push(...res.value);
    } else {
      chunksFailed++;
      firstError ??= res.message;
      for (let i = 0; i < res.size; i++) rates.push(null);
    }
  }
  return firstError === undefined ? { rates, chunksFailed } : { rates, chunksFailed, firstError };
}

/** Full chunks ride {@link BATCH_RATES_15}; tail chunks fall back to parallel {@link fetchExchangeRate}. */
async function fetchRateChunk(
  api: SuiGraphQLClient,
  plans: ReadonlyArray<{ exchangeRatesId: string; epoch: number | string }>,
  fullChunkSize: number,
): Promise<Array<ExchangeRate | null>> {
  if (plans.length < fullChunkSize) {
    // Same cap applies: tail fan-out can be ~14 single queries; smooth them through the batched runner.
    return promiseAllBatched(RATE_CHUNK_CONCURRENCY, [...plans], p =>
      fetchExchangeRate(api, p.exchangeRatesId, p.epoch),
    );
  }
  // $t0/$l0…$t14/$l14 mirror BATCH_RATES_15's variable names: t = table address, l = epoch literal.
  const variables = Object.fromEntries(
    plans.flatMap((p, i) => [
      [`t${i}`, p.exchangeRatesId],
      [`l${i}`, `${p.epoch}u64`],
    ]),
  ) as VariablesOf<typeof BATCH_RATES_15>;
  const res = await api.query({
    query: BATCH_RATES_15,
    variables,
  });
  const data = unwrapGraphQL("BatchExchangeRates", res);
  return plans.map((_, i) => parseExchangeRateNode(data[`v${i}` as keyof typeof data] ?? null));
}

// ============================================================================
// Public per-function GraphQL handlers (passed to `withTransport` from sdk.ts)
// ============================================================================

/** Paginates `BalanceConnection`; JSON-RPC-only `coinObjectCount`/`lockedBalance` are stubbed. */
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
      const res = await api.query({
        query: ALL_BALANCES_BY_OWNER,
        variables: { owner: ownerAddr, cursor },
      });
      const conn = unwrapGraphQL("ListBalances", res).address?.balances;
      return {
        // Drop nodes with no `coinType.repr` — the schema marks `Balance.coinType` nullable,
        // and a missing identifier would surface as a malformed entry downstream.
        // `BigInt`-typed wire fields are nullable; "0" matches the JSON-RPC contract
        // that downstream stringly-typed maths assumes.
        items: (conn?.nodes ?? []).flatMap(b => {
          const repr = b.coinType?.repr;
          return repr
            ? [
                {
                  // long → short coin type; consumers compare against `DEFAULT_COIN_TYPE`.
                  coinType: shortenCoinType(repr),
                  coinObjectCount: 0,
                  totalBalance: b.totalBalance ?? "0",
                  lockedBalance: {},
                  fundsInAddressBalance: b.addressBalance ?? "0",
                },
              ]
            : [];
        }),
        endCursor: conn?.pageInfo.endCursor ?? null,
        hasNextPage: conn?.pageInfo.hasNextPage ?? false,
      };
    },
  });
  return items;
};

/** Reconstructs `DelegatedStake[]` from `StakedSui` + system-state; rate failures degrade `estimatedReward` to `"0"`. */
export const getDelegatedStakesGraphQL = async (
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

/** GraphQL's `Query.checkpoint(sequenceNumber:)` only accepts UInt53; digests must route to JSON-RPC. */
export const getCheckpointGraphQL = async (
  api: SuiGraphQLClient,
  id: string | number,
): Promise<Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">> => {
  // UInt53 is a JSON number both directions; server rejects quoted strings.
  // `isSafeInteger` rules out NaN, digests, fractions, and out-of-range values
  // that would silently lose precision via `Number(id)`.
  const seq = typeof id === "number" ? id : Number(id);
  if (!Number.isSafeInteger(seq) || seq < 0) {
    // Defence in depth: the dispatcher in sdk.ts already routes digests to JSON-RPC.
    throw new TypeError(
      `getCheckpointGraphQL: not a sequence number (id=${id}); digest lookups must route to JSON-RPC.`,
    );
  }
  const res = await api.query({
    query: CHECKPOINT_BY_SEQUENCE,
    variables: { sequenceNumber: seq },
  });
  const cp = unwrapGraphQL("CheckpointBySequence", res).checkpoint;
  if (!cp) {
    throw new Error(`GraphQL CheckpointBySequence failed: not found (id=${id})`);
  }
  // RFC3339 → epoch-ms string (JSON-RPC convention).
  const timestampMs = cp.timestamp ? String(new Date(cp.timestamp).getTime()) : "0";
  return {
    digest: cp.digest ?? "",
    sequenceNumber: String(cp.sequenceNumber),
    timestampMs,
  };
};

/** Latest checkpoint via `LATEST_CHECKPOINT_SEQUENCE` + `getCheckpointGraphQL`. */
export const getLastBlockGraphQL = async (
  api: SuiGraphQLClient,
): Promise<Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">> => {
  const res = await api.query({
    query: LATEST_CHECKPOINT_SEQUENCE,
  });
  const seq = unwrapGraphQL("LatestCheckpointSequence", res).checkpoint?.sequenceNumber;
  if (seq === null || seq === undefined) {
    throw new Error("GraphQL LatestCheckpointSequence failed: no checkpoint");
  }
  return getCheckpointGraphQL(api, seq);
};

type ApyPlan = {
  suiAddress: string;
  exchangeRatesId: string;
  currentRate: ExchangeRate;
  pastEpoch: number;
};

/** One historical-rate plan per active validator with a known pool; orphans are skipped. */
function planValidatorApyLookups(
  poolRefs: Map<string, PoolRefs>,
  poolToValidator: Map<string, string>,
  currentEpoch: number,
): ApyPlan[] {
  const plans: ApyPlan[] = [];
  for (const [stakingPoolId, refs] of poolRefs) {
    const suiAddress = poolToValidator.get(stakingPoolId);
    if (!suiAddress) continue;
    // 30-epoch lookback; clamp to activation epoch for young pools.
    const desired = currentEpoch - APY_LOOKBACK_EPOCHS;
    const pastEpoch = Math.max(desired, refs.activationEpoch);
    plans.push({
      suiAddress,
      exchangeRatesId: refs.exchangeRatesId,
      currentRate: refs.currentRate,
      pastEpoch,
    });
  }
  return plans;
}

/** Missing/failed rates degrade to apy=0; aggregate degradation surfaces via telemetry. */
function applyValidatorApy(
  plans: ReadonlyArray<ApyPlan>,
  rates: ReadonlyArray<ExchangeRate | null>,
  currentEpoch: number,
  chunksFailed: number,
  firstError?: string,
): Map<string, number> {
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
  if (rateMissing > 0 || chunksFailed > 0) {
    log("warn", "sui-graphql:rate-fetch-degraded", {
      source: "validator-apy",
      missing: rateMissing,
      chunksFailed,
      total: plans.length,
      ...(firstError !== undefined && { firstError }),
    });
  }
  return apyByAddress;
}

/**
 * Active validator set with client-side APY over {@link APY_LOOKBACK_EPOCHS} (Mysten's formula).
 * Young pools clamp the past epoch to activation; per-rate nulls degrade to apy=0.
 */
export const getValidatorsGraphQL = async (api: SuiGraphQLClient): Promise<SuiValidator[]> => {
  const res = await api.query({
    query: SUI_SYSTEM_STATE,
  });
  const { epoch, stateJson } = unwrapAndValidateSystemState(res);
  const { activeValidators, poolToValidator } = fromSystemStateJson(stateJson);
  const poolRefs = poolRefsFromSystemState(stateJson);
  const currentEpoch = Number(epoch.epochId);
  const plans = planValidatorApyLookups(poolRefs, poolToValidator, currentEpoch);
  const { rates, chunksFailed, firstError } = await fetchExchangeRatesBatched(
    api,
    plans.map(p => ({ exchangeRatesId: p.exchangeRatesId, epoch: p.pastEpoch })),
    RATE_BATCH_CHUNK_SIZE,
  );
  const apyByAddress = applyValidatorApy(plans, rates, currentEpoch, chunksFailed, firstError);
  return activeValidators.map(v => ({ ...v, apy: apyByAddress.get(v.suiAddress) ?? 0 }));
};

// ============================================================================
// Transaction history (`getOperations` + `getOperationExtra` paths)
// ============================================================================

/** Fetch a single transaction by digest, projected to JSON-RPC shape; null on miss. */
export const getTransactionByDigestGraphQL = async (
  api: SuiGraphQLClient,
  digest: string,
): Promise<SuiTransactionBlockResponse | null> => {
  const res = await api.query({
    query: TRANSACTION_BY_DIGEST,
    variables: { digest, eventsFirst: EVENTS_PAGE_SIZE },
  });
  const tx = unwrapGraphQL("TransactionByDigest", res).transaction;
  return tx ? graphqlTxToJsonRpcResponse(tx) : null;
};

/**
 * Paginated transaction history via the `affectedAddress` filter — covers
 * sender, sponsor, and recipient in one query. Backward pagination
 * (`last`/`before`) yields newest-first order. `beforeCheckpoint`/
 * `afterCheckpoint` translate alpaca-style cursors to a server-side filter.
 */
export const getTransactionsByAddressGraphQL = async (
  api: SuiGraphQLClient,
  address: string,
  limit: number,
  pageSize: number,
  cursor: string | null = null,
  filter?: { beforeCheckpoint?: number; afterCheckpoint?: number },
): Promise<{ items: SuiTransactionBlockResponse[]; startCursor: string | null }> => {
  const ownerAddr = normalizeSuiAddress(address);
  const accumulated: SuiTransactionBlockResponse[] = [];
  let nextBefore: string | null = cursor;
  let pages = 0;

  while (accumulated.length < limit) {
    if (pages >= MAX_PAGES) {
      throw new Error(
        `getTransactionsByAddressGraphQL: exceeded ${MAX_PAGES} pages — server hasPreviousPage may be misreporting.`,
      );
    }
    const res = await api.query({
      query: TRANSACTIONS_BY_AFFECTED_ADDRESS,
      variables: {
        address: ownerAddr,
        last: pageSize,
        before: nextBefore,
        eventsFirst: EVENTS_PAGE_SIZE,
        ...(filter?.beforeCheckpoint !== undefined && {
          beforeCheckpoint: filter.beforeCheckpoint,
        }),
        ...(filter?.afterCheckpoint !== undefined && { afterCheckpoint: filter.afterCheckpoint }),
      },
    });
    const conn = unwrapGraphQL("TransactionsByAffectedAddress", res).transactions;
    if (!conn) break;
    // `last/before` returns ascending-within-page; reverse so the accumulated array stays
    // newest-first across pages, matching the JSON-RPC contract. Skip not-yet-finalized nodes
    // (indexing lag right after broadcast) — mapping them yields bogus Failed/1970 ops; they
    // reappear, complete, on a later sync. Then cap the accumulator at `limit`.
    accumulated.push(
      ...(conn.nodes ?? [])
        .slice()
        .reverse()
        .filter(isFinalizedTxNode)
        .map(graphqlTxToJsonRpcResponse),
    );
    if (accumulated.length > limit) accumulated.length = limit;
    if (!conn.pageInfo.hasPreviousPage || !conn.pageInfo.startCursor) {
      nextBefore = null;
      break;
    }
    nextBefore = conn.pageInfo.startCursor;
    pages++;
  }

  return { items: accumulated, startCursor: nextBefore };
};

/**
 * Resolve a transaction digest to its checkpoint sequence number. Used to
 * translate `getListOperations`' alpaca-style `timestamp:digest` cursor into
 * a server-side `beforeCheckpoint`/`afterCheckpoint` filter. Returns `null`
 * if the digest isn't found or hasn't been finalised.
 */
export const resolveCheckpointSequenceForDigestGraphQL = async (
  api: SuiGraphQLClient,
  digest: string,
): Promise<number | null> => {
  const res = await api.query({
    query: TRANSACTION_BY_DIGEST,
    variables: { digest, eventsFirst: EVENTS_PAGE_SIZE },
  });
  const seq = unwrapGraphQL("TransactionByDigest", res).transaction?.effects?.checkpoint
    ?.sequenceNumber;
  return seq === undefined || seq === null ? null : Number(seq);
};

/**
 * Per-page transaction history with the per-tx checkpoint digest exposed
 * alongside (which `transactionToCoinFrameworkOperation` needs as a synthetic blockHash).
 * Cheaper than the JSON-RPC version's separate per-checkpoint lookup —
 * `checkpoint.digest` is fetched in the same `transactions` round-trip.
 */
export const getTransactionsWithCheckpointDigestsGraphQL = async (
  api: SuiGraphQLClient,
  address: string,
  pageSize: number,
  filter?: { beforeCheckpoint?: number; afterCheckpoint?: number },
): Promise<{ tx: SuiTransactionBlockResponse; checkpointDigest: string | undefined }[]> => {
  const ownerAddr = normalizeSuiAddress(address);
  const res = await api.query({
    query: TRANSACTIONS_BY_AFFECTED_ADDRESS,
    variables: {
      address: ownerAddr,
      last: pageSize,
      before: null,
      eventsFirst: EVENTS_PAGE_SIZE,
      ...(filter?.beforeCheckpoint !== undefined && { beforeCheckpoint: filter.beforeCheckpoint }),
      ...(filter?.afterCheckpoint !== undefined && { afterCheckpoint: filter.afterCheckpoint }),
    },
  });
  const conn = unwrapGraphQL("TransactionsByAffectedAddress", res).transactions;
  const nodes = (conn?.nodes ?? []).slice().reverse(); // newest-first across the page
  // Skip not-yet-finalized nodes (indexing lag) — they'd map to bogus Failed/1970 ops.
  return nodes.filter(isFinalizedTxNode).map(node => ({
    tx: graphqlTxToJsonRpcResponse(node),
    checkpointDigest: node.effects?.checkpoint?.digest ?? undefined,
  }));
};

/**
 * Checkpoint metadata only — `digest`, `sequenceNumber`, `timestampMs`,
 * `previousDigest`. Caller (`getBlockInfo`) reshapes to `BlockInfo`.
 */
export const getBlockInfoFieldsGraphQL = async (
  api: SuiGraphQLClient,
  sequenceNumber: number,
): Promise<{
  digest: string;
  sequenceNumber: string;
  timestampMs: string;
  previousDigest: string | null;
} | null> => {
  const res = await api.query({
    query: CHECKPOINT_BY_SEQUENCE,
    variables: { sequenceNumber },
  });
  const cp = unwrapGraphQL("CheckpointBySequence", res).checkpoint;
  if (!cp) return null;
  return {
    digest: cp.digest ?? "",
    sequenceNumber: String(cp.sequenceNumber),
    timestampMs: cp.timestamp ? String(new Date(cp.timestamp).getTime()) : "0",
    previousDigest: cp.previousCheckpointDigest ?? null,
  };
};

/**
 * Checkpoint + every transaction in the block. Each tx is run through the
 * shared `graphqlTxToJsonRpcResponse` adapter so `toBlockTransaction` works
 * unchanged. Paginates `transactions` until `hasNextPage` is false, bounded by
 * `MAX_PAGES`; the block's metadata is taken from the first page.
 */
export const getBlockGraphQL = async (
  api: SuiGraphQLClient,
  sequenceNumber: number,
): Promise<{
  info: {
    digest: string;
    sequenceNumber: string;
    timestampMs: string;
    previousDigest: string | null;
  };
  transactions: SuiTransactionBlockResponse[];
} | null> => {
  const transactions: SuiTransactionBlockResponse[] = [];
  let info: {
    digest: string;
    sequenceNumber: string;
    timestampMs: string;
    previousDigest: string | null;
  } | null = null;
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await api.query({
      query: BLOCK_BY_SEQUENCE,
      variables: {
        sequenceNumber,
        txFirst: BLOCK_TXS_PAGE_SIZE,
        eventsFirst: EVENTS_PAGE_SIZE,
        ...(after !== undefined && { txAfter: after }),
      },
    });
    const cp = unwrapGraphQL("BlockBySequence", res).checkpoint;
    if (!cp) return null;
    info ??= {
      digest: cp.digest ?? "",
      sequenceNumber: String(cp.sequenceNumber),
      timestampMs: cp.timestamp ? String(new Date(cp.timestamp).getTime()) : "0",
      previousDigest: cp.previousCheckpointDigest ?? null,
    };
    transactions.push(...(cp.transactions?.nodes ?? []).map(graphqlTxToJsonRpcResponse));
    const pageInfo = cp.transactions?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    after = pageInfo.endCursor;
    // Fail loudly rather than silently truncating: the caller (`getBlock`) contract is "all txs in the block".
    if (page === MAX_PAGES - 1) {
      throw new Error(
        `getBlockGraphQL: checkpoint ${sequenceNumber} has more than ${MAX_PAGES * BLOCK_TXS_PAGE_SIZE} transactions — pagination cap hit.`,
      );
    }
  }

  return info ? { info, transactions } : null;
};

// ============================================================================
// Write side (`paymentInfo` dry-run + `executeTransactionBlock` broadcast)
// ============================================================================

/** Uint8Array BCS → Base64 for `simulateTransaction`/`executeTransaction`; pass through if already encoded. */
function bcsToBase64(transactionBlock: Uint8Array | string): string {
  return typeof transactionBlock === "string" ? transactionBlock : toBase64(transactionBlock);
}

/** Dry-run via `simulateTransaction`; returns the gas summary in the shape `paymentInfo` consumes from JSON-RPC. */
export const simulateTransactionGraphQL = async (
  api: SuiGraphQLClient,
  transactionBlock: Uint8Array | string,
): Promise<{
  gasBudget: string;
  computationCost: string;
  storageCost: string;
  storageRebate: string;
}> => {
  const res = await api.query({
    query: SIMULATE_TRANSACTION,
    variables: { transaction: { bcs: { value: bcsToBase64(transactionBlock) } } },
  });
  const sim = unwrapGraphQL("SimulateTransaction", res).simulateTransaction;
  const gas = sim.effects?.gasEffects?.gasSummary;
  const budget = sim.effects?.transaction?.gasInput?.gasBudget;
  return {
    gasBudget: String(budget ?? "0"),
    computationCost: String(gas?.computationCost ?? "0"),
    storageCost: String(gas?.storageCost ?? "0"),
    storageRebate: String(gas?.storageRebate ?? "0"),
  };
};

/**
 * Broadcast via the `executeTransaction` mutation; returns the digest + status subset that
 * `executeTransactionBlock` consumes. GraphQL waits for finality but indexing of effects may lag —
 * callers needing post-finality state must poll `transaction(digest:)` separately.
 */
export const executeTransactionGraphQL = async (
  api: SuiGraphQLClient,
  transactionBlock: Uint8Array | string,
  signatures: string[],
): Promise<{ digest: string; status: "SUCCESS" | "FAILURE" | null; error?: string }> => {
  const res = await api.query({
    query: EXECUTE_TRANSACTION,
    variables: { transactionDataBcs: bcsToBase64(transactionBlock), signatures },
  });
  const eff = unwrapGraphQL("ExecuteTransaction", res).executeTransaction.effects;
  const status = (eff?.status ?? null) as "SUCCESS" | "FAILURE" | null;
  // Mine the error string for FAILURE so broadcast.ts can surface it; same shape as the read-side adapter.
  const error =
    status === "FAILURE"
      ? extractFailureError((eff?.effectsJson ?? {}) as Record<string, unknown>)
      : undefined;
  return {
    digest: eff?.digest ?? "",
    status,
    ...(error !== undefined && { error }),
  };
};
