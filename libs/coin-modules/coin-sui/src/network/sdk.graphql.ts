import { log } from "@ledgerhq/logs";
import { CoinBalance, Checkpoint, DelegatedStake } from "@mysten/sui/jsonRpc";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import coinConfig from "../config";
import { fetcher, inferNetworkFromUrl } from "./fetcher";
import {
  BATCH_RATES_15,
  CHECKPOINT_BY_SEQUENCE,
  EXCHANGE_RATE_AT_EPOCH,
  LATEST_CHECKPOINT_SEQUENCE,
  STAKED_SUI_OBJECTS_BY_OWNER,
  SUI_SYSTEM_STATE,
  type SuiSystemStateResult,
} from "./graphql/queries";
import {
  assertSystemStateJson,
  computeStakeRewards,
  fromSystemStateJson,
  groupStakedSuiByPool,
  parseExchangeRateNode,
  planActivationRateLookups,
  poolRefsFromSystemState,
  shortenCoinType,
  validateStakedSuiNodes,
  type PoolRefs,
  type StakeNode,
  type StakeRatePlans,
  type SuiSystemStateInnerJson,
  type ExchangeRate,
} from "./graphql/utils";
import type { VariablesOf } from "./graphql/tada";
import { MAX_CURSOR_RETRIES, RATE_BATCH_CHUNK_SIZE, STAKES_PAGE_SIZE } from "./graphql/constants";

export type AsyncGraphQLApiFunction<T> = (
  api: SuiGraphQLClient,
  signal?: AbortSignal,
) => Promise<T>;

export async function withGraphQLApi<T>(
  execute: AsyncGraphQLApiFunction<T>,
  currencyId?: string,
  signal?: AbortSignal,
): Promise<T> {
  const url = coinConfig.getCoinConfig(currencyId).node.url;
  const api = new SuiGraphQLClient({
    url,
    network: inferNetworkFromUrl(url),
    fetch: fetcher,
  });
  return execute(api, signal);
}

/**
 * Envelope handler for `SuiGraphQLClient.query()`: throws on populated
 * `errors[]` (joined) or missing `data`.
 */
function unwrapGraphQL<T>(
  label: string,
  res: { data?: T | null; errors?: readonly { message: string }[] | null },
): NonNullable<T> {
  if (res.errors?.length) {
    throw new Error(`GraphQL ${label} failed: ${res.errors.map(e => e.message).join("; ")}`);
  }
  if (res.data === null || res.data === undefined) {
    throw new Error(`GraphQL ${label} failed: no data`);
  }
  return res.data as NonNullable<T>;
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
  signal?: AbortSignal;
}): Promise<{ items: T[]; retries: number }> {
  const maxRetries = config.maxRetries ?? MAX_CURSOR_RETRIES;
  let seed: CursorPage<T> | undefined = config.seed;

  // attempt 0 = initial walk; attempt 1..maxRetries = post-cursor-expiry restarts.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    config.signal?.throwIfAborted?.();
    const items: T[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    try {
      while (hasMore) {
        // Per-page abort gate so a long pagination short-circuits without relying on transport cooperation.
        config.signal?.throwIfAborted?.();
        let page: CursorPage<T>;
        if (seed === undefined) {
          page = await config.fetchPage(cursor);
        } else {
          page = seed;
          seed = undefined;
        }
        items.push(...page.items);
        cursor = page.endCursor;
        hasMore = page.hasNextPage && cursor !== null;
      }
      return { items, retries: attempt };
    } catch (e) {
      // Permissive cursor-expiry match — false positive only costs a restart-from-page-1 retry.
      const cursorExpired =
        e instanceof Error && /outside (?:the )?available range/i.test(e.message);
      if (attempt < maxRetries && cursorExpired) {
        log("warn", "sui-graphql:cursor-expired", {
          source: config.source,
          retry: attempt + 1,
        });
        seed = undefined; // expired with the original cursor
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
  signal?: AbortSignal,
): Promise<{
  currentEpoch: bigint;
  epochId: string | number;
  poolToValidator: Map<string, string>;
  poolRefs: Map<string, PoolRefs>;
  seedPage: CursorPage<StakeNode> | undefined;
}> {
  const [systemRes, stakesRes] = await Promise.all([
    api.query({ query: SUI_SYSTEM_STATE, ...(signal && { signal }) }),
    api.query({
      query: STAKED_SUI_OBJECTS_BY_OWNER,
      variables: { owner: ownerAddr, first: STAKES_PAGE_SIZE, after: null },
      ...(signal && { signal }),
    }),
  ]);
  // Skip validation/mapping if caller unsubscribed mid-flight.
  signal?.throwIfAborted?.();
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
  signal?: AbortSignal,
): Promise<StakeNode[]> {
  const { items } = await paginateWithCursorRecovery<StakeNode>({
    source: "stakes",
    ...(seed !== undefined && { seed }),
    ...(signal && { signal }),
    fetchPage: async cursor => {
      const res = await api.query({
        query: STAKED_SUI_OBJECTS_BY_OWNER,
        variables: { owner: ownerAddr, first: STAKES_PAGE_SIZE, after: cursor },
        ...(signal && { signal }),
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
  signal?: AbortSignal,
): Promise<Map<string, ExchangeRate | null>> {
  const {
    rates: rateArr,
    chunksFailed,
    firstError,
  } = await fetchExchangeRatesBatched(
    api,
    plans.wantedEntries.map(({ table, epoch }) => ({ exchangeRatesId: table, epoch })),
    RATE_BATCH_CHUNK_SIZE,
    signal,
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

/** Worker-pool style: at most `limit` concurrent `fn` invocations; returns results in input order. */
async function mapWithLimit<T, R>(
  items: ReadonlyArray<T>,
  limit: number,
  fn: (x: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** Concurrent in-flight rate-chunk requests; bounded to avoid bursty fan-out under heavy validator sets. */
const RATE_CHUNK_CONCURRENCY = 4;

/** `null` when the rates table has no entry at that epoch; errors propagate for caller-side triage. */
async function fetchExchangeRate(
  api: SuiGraphQLClient,
  exchangeRatesId: string,
  epoch: number | string,
  signal?: AbortSignal,
): Promise<ExchangeRate | null> {
  const res = await api.query({
    query: EXCHANGE_RATE_AT_EPOCH,
    variables: { table: exchangeRatesId, literal: `${epoch}u64` },
    ...(signal && { signal }),
  });
  return parseExchangeRateNode(unwrapGraphQL(`ExchangeRate(${epoch})`, res).address ?? null);
}

/** Batched {@link fetchExchangeRate}: 1:1 output, `null` on miss, transport failures via `chunksFailed`/`firstError`. */
async function fetchExchangeRatesBatched(
  api: SuiGraphQLClient,
  plans: ReadonlyArray<{ exchangeRatesId: string; epoch: number | string }>,
  chunkSize: number,
  signal?: AbortSignal,
): Promise<{ rates: Array<ExchangeRate | null>; chunksFailed: number; firstError?: string }> {
  if (plans.length === 0) return { rates: [], chunksFailed: 0 };
  const safeChunk = Math.max(1, Math.floor(chunkSize));
  const chunks: Array<typeof plans> = [];
  for (let i = 0; i < plans.length; i += safeChunk) {
    chunks.push(plans.slice(i, i + safeChunk));
  }
  // INVARIANT: each chunk's result length matches its input length — null-pad on failure preserves 1:1.
  const settled = await mapWithLimit(chunks, RATE_CHUNK_CONCURRENCY, async chunk => {
    try {
      return { ok: true as const, value: await fetchRateChunk(api, chunk, safeChunk, signal) };
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
  signal?: AbortSignal,
): Promise<Array<ExchangeRate | null>> {
  if (plans.length < fullChunkSize) {
    // Same cap applies: tail fan-out can be ~14 single queries; smooth them through a worker pool.
    return mapWithLimit(plans, RATE_CHUNK_CONCURRENCY, p =>
      fetchExchangeRate(api, p.exchangeRatesId, p.epoch, signal),
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
    ...(signal && { signal }),
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
  signal?: AbortSignal,
): Promise<CoinBalance[]> => {
  // GraphQL's `SuiAddress!` requires the canonical 32-byte form;
  // JSON-RPC was tolerant. Normalise once at the boundary.
  const ownerAddr = normalizeSuiAddress(owner);
  const { items } = await paginateWithCursorRecovery<CoinBalance>({
    source: "balances",
    ...(signal && { signal }),
    fetchPage: async cursor => {
      const res = await api.listBalances({
        owner: ownerAddr,
        cursor,
        ...(signal && { signal }),
      });
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

/** Reconstructs `DelegatedStake[]` from `StakedSui` + system-state; rate failures degrade `estimatedReward` to `"0"`. */
export const getDelegatedStakesGraphQL = async (
  api: SuiGraphQLClient,
  owner: string,
  signal?: AbortSignal,
): Promise<DelegatedStake[]> => {
  // Canonicalise once — GraphQL `SuiAddress!` rejects short forms.
  const ownerAddr = normalizeSuiAddress(owner);
  const sys = await fetchSystemStateAndStakesPage(api, ownerAddr, signal);
  const rawNodes = await paginateRemainingStakes(api, ownerAddr, sys.seedPage, signal);
  const { items, malformed } = validateStakedSuiNodes(rawNodes);
  const plans = planActivationRateLookups(items, sys.currentEpoch, sys.poolRefs);
  const rates = await fetchActivationRates(api, plans, malformed, signal);
  const rewards = computeStakeRewards(plans.activeStakes, sys.poolRefs, rates);
  return groupStakedSuiByPool(items, sys.epochId, sys.poolToValidator, rewards);
};

/** GraphQL's `Query.checkpoint(sequenceNumber:)` only accepts UInt53; digests must route to JSON-RPC. */
export const getCheckpointGraphQL = async (
  api: SuiGraphQLClient,
  id: string | number,
  signal?: AbortSignal,
): Promise<Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">> => {
  // UInt53 is a JSON number both directions; server rejects quoted strings.
  const seq = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(seq)) {
    // Defence in depth: the dispatcher in sdk.ts already routes digests to JSON-RPC.
    throw new TypeError(
      `getCheckpointGraphQL: not a sequence number (id=${id}); digest lookups must route to JSON-RPC.`,
    );
  }
  const res = await api.query({
    query: CHECKPOINT_BY_SEQUENCE,
    variables: { sequenceNumber: seq },
    ...(signal && { signal }),
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
  signal?: AbortSignal,
): Promise<Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">> => {
  const res = await api.query({
    query: LATEST_CHECKPOINT_SEQUENCE,
    ...(signal && { signal }),
  });
  const seq = unwrapGraphQL("LatestCheckpointSequence", res).checkpoint?.sequenceNumber;
  if (seq === null || seq === undefined) {
    throw new Error("GraphQL LatestCheckpointSequence failed: no checkpoint");
  }
  return getCheckpointGraphQL(api, seq, signal);
};
