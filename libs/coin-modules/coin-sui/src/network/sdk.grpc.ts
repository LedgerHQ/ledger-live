import { log } from "@ledgerhq/logs";
import type {
  Checkpoint,
  CoinBalance,
  DelegatedStake,
  SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import type { SuiGrpcClient, GrpcTypes } from "@mysten/sui/grpc";
import { deriveDynamicFieldID, fromBase64, normalizeSuiAddress } from "@mysten/sui/utils";
import { type SuiCoinConfig } from "../config";
import { toShortStructTag } from "../utils";
import { createSuiGrpcClient } from "./grpc/client";
import { executionErrorMessage, grpcTxToJsonRpcResponse } from "./grpc/transactions";
import { protoValueToJson } from "./grpc/struct";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { SuiValidator } from "../types";
import {
  applyValidatorApy,
  assertSystemStateJson,
  computeStakeRewards,
  isU64Numeric,
  groupStakedSuiByPool,
  isStakedSuiJson,
  planActivationRateLookups,
  type StakedSuiJson,
  type ExchangeRate,
  fromSystemStateJson,
  planValidatorApyLookups,
  poolRefsFromSystemState,
  type SuiSystemStateInnerJson,
} from "./staking";

export type AsyncGrpcApiFunction<T> = (api: SuiGrpcClient) => Promise<T>;

/** Server caps `ListBalances` at 1000; 50 matches the GraphQL page size. */
const BALANCES_PAGE_SIZE = 50;

/** Mirrors the GraphQL walker's cap so a server misreporting a page token can't spin forever. */
const MAX_PAGES = 100;

/**
 * gRPC-web counterpart of `withGraphQLApi`. Fresh client per call — `SuiGrpcClient` holds no
 * per-call state, and the transport it wraps is cheap to build.
 */
export async function withGrpcApi<T>(
  config: SuiCoinConfig,
  execute: AsyncGrpcApiFunction<T>,
): Promise<T> {
  const url = config.node.grpcUrl;
  return execute(createSuiGrpcClient({ url }));
}

/** Checkpoint fields the block/checkpoint mappers read, in JSON-RPC's stringly-typed shape. */
export type GrpcCheckpointFields = Pick<
  Checkpoint,
  "digest" | "sequenceNumber" | "timestampMs" | "previousDigest"
>;

/**
 * `GetCheckpoint` accepts a sequence number or a digest, so — unlike GraphQL — the gRPC arm
 * needs no JSON-RPC fallback for digest lookups.
 */
const toCheckpointId = (id: string): GrpcTypes.GetCheckpointRequest["checkpointId"] =>
  /^\d+$/.test(id)
    ? { oneofKind: "sequenceNumber", sequenceNumber: BigInt(id) }
    : { oneofKind: "digest", digest: id };

/** Read mask covering exactly the fields {@link GrpcCheckpointFields} exposes. */
const CHECKPOINT_READ_MASK = {
  paths: ["sequence_number", "digest", "summary.timestamp", "summary.previous_digest"],
};

export const getCheckpointGrpc = async (
  api: SuiGrpcClient,
  id: string,
): Promise<GrpcCheckpointFields> => {
  const { checkpoint } = await api.ledgerService.getCheckpoint({
    checkpointId: toCheckpointId(id),
    readMask: CHECKPOINT_READ_MASK,
  }).response;

  if (!checkpoint) throw new Error(`gRPC Checkpoint not found: ${id}`);
  return toCheckpointFields(checkpoint);
};

/**
 * Latest checkpoint in one round trip: an unset `checkpoint_id` returns the tip, so this
 * needs no equivalent of JSON-RPC's separate `getLatestCheckpointSequenceNumber` call.
 */
export const getLastBlockGrpc = async (api: SuiGrpcClient): Promise<GrpcCheckpointFields> => {
  const { checkpoint } = await api.ledgerService.getCheckpoint({
    checkpointId: { oneofKind: undefined },
    readMask: CHECKPOINT_READ_MASK,
  }).response;

  if (!checkpoint) throw new Error("gRPC GetCheckpoint returned no latest checkpoint");
  return toCheckpointFields(checkpoint);
};

/**
 * Every caller requests `digest` and `summary.timestamp` in its read mask, so an absent one is a
 * malformed response rather than a field we chose not to fetch. Coercing it would hand sync an empty
 * block hash or a 1970 timestamp — matching the GraphQL arm, which throws for the same reason.
 *
 * Sequence number 0 is genesis, not a missing value, and `previousDigest` is absent there by design.
 */
function toCheckpointFields(checkpoint: GrpcTypes.Checkpoint): GrpcCheckpointFields {
  const seconds = checkpoint.summary?.timestamp?.seconds;
  const nanos = checkpoint.summary?.timestamp?.nanos ?? 0;
  const seq = (checkpoint.sequenceNumber ?? 0n).toString();
  if (!checkpoint.digest) throw new Error(`gRPC checkpoint ${seq} has no digest`);
  if (seconds === undefined) throw new Error(`gRPC checkpoint ${seq} has no timestamp`);
  return {
    digest: checkpoint.digest,
    sequenceNumber: seq,
    // JSON-RPC exposes epoch milliseconds as a string; protobuf splits it into seconds+nanos.
    timestampMs: (seconds * 1000n + BigInt(Math.floor(nanos / 1e6))).toString(),
    ...(checkpoint.summary?.previousDigest !== undefined && {
      previousDigest: checkpoint.summary.previousDigest,
    }),
  };
}

/** Sub-fields of each `ExecutedTransaction` the response adapter reads. */
const BLOCK_TX_READ_MASK = [
  "transactions.digest",
  "transactions.transaction",
  "transactions.effects",
  "transactions.events",
  "transactions.balance_changes",
  "transactions.timestamp",
  "transactions.checkpoint",
];

/**
 * Checkpoint plus its transactions, already projected into the legacy response shape.
 *
 * Transactions nested in a checkpoint may omit `timestamp`/`checkpoint` — they are implied by the
 * enclosing checkpoint — so those are backfilled from it.
 */
export const getBlockGrpc = async (
  api: SuiGrpcClient,
  id: string,
): Promise<{ info: GrpcCheckpointFields; transactions: SuiTransactionBlockResponse[] }> => {
  const { checkpoint } = await api.ledgerService.getCheckpoint({
    checkpointId: toCheckpointId(id),
    readMask: { paths: [...CHECKPOINT_READ_MASK.paths, ...BLOCK_TX_READ_MASK] },
  }).response;

  if (!checkpoint) throw new Error(`gRPC Block not found: ${id}`);
  const info = toCheckpointFields(checkpoint);

  return {
    info,
    transactions: (checkpoint.transactions ?? []).map(executed => {
      const mapped = grpcTxToJsonRpcResponse(executed);
      return {
        ...mapped,
        timestampMs: mapped.timestampMs ?? info.timestampMs,
        checkpoint: mapped.checkpoint ?? info.sequenceNumber,
      };
    }),
  };
};

/** `0x5`, the `SuiSystemState` wrapper object. */
const SUI_SYSTEM_STATE_ID = `0x${"0".repeat(63)}5`;

/**
 * Current system state as Move JSON, ready for the transport-neutral guards in `network/staking.ts`.
 *
 * `core.getCurrentSystemState()` is not usable here: its `SystemStateInfo` carries epoch, gas price,
 * parameters, storage fund and stake subsidy but **no validator set**, so it exposes none of the pool
 * ids or exchange-rate tables that stake rewards and APY are derived from.
 *
 * The validator set lives in the versioned inner object, reached in three steps: read the `0x5`
 * wrapper, list its single dynamic field (keyed by system-state version), then read that field's
 * object. Its `json` is a protobuf `Value`, so it is unwrapped before validation.
 */
export const getSystemStateGrpc = async (api: SuiGrpcClient): Promise<SuiSystemStateInnerJson> => {
  const { dynamicFields } = await api.core.listDynamicFields({
    parentId: SUI_SYSTEM_STATE_ID,
  });
  const fieldId = dynamicFields?.[0]?.fieldId;
  if (!fieldId) {
    throw new Error("sui: SuiSystemState wrapper exposed no dynamic field for the inner state");
  }

  const { object } = await api.ledgerService.getObject({
    objectId: fieldId,
    readMask: { paths: ["object_id", "object_type", "json"] },
  }).response;

  // Dynamic-field objects nest their payload under `value`; the root fallback is defensive.
  const json = protoValueToJson(object?.json) as Record<string, unknown> | undefined;
  const inner = (json?.value ?? json) as unknown;

  assertSystemStateJson(inner);
  return inner;
};

/**
 * Rate lookups per `BatchGetObjects` call. No server or proxy cap is documented, so this stays well
 * below anything observed to work while still collapsing the active validator set into two requests.
 */
const RATE_BATCH_SIZE = 100;

/** Concurrent batches. With 100 ids per batch this is a ceiling, not a throughput knob. */
const RATE_BATCH_CONCURRENCY = 4;

/** Only the field's Move JSON is read; `object_id` keeps results attributable while debugging. */
const RATE_FIELD_READ_MASK = { paths: ["object_id", "json"] };

/** Little-endian BCS for a Move `u64` — the epoch key indexing a pool's rate table. */
function u64Key(epoch: number): Uint8Array {
  const bcs = new Uint8Array(8);
  new DataView(bcs.buffer).setBigUint64(0, BigInt(epoch), true);
  return bcs;
}

/**
 * `Field<u64, PoolTokenExchangeRate>` Move JSON → {@link ExchangeRate}.
 *
 * The rate sits under `value`; `name` is the epoch key. Amounts stay decimal strings because they
 * routinely exceed `Number.MAX_SAFE_INTEGER`, and a non-numeric field yields `null` rather than a
 * rate that would silently distort an APY.
 */
function exchangeRateFromFieldJson(json: unknown): ExchangeRate | null {
  const value = (json as { value?: unknown } | undefined)?.value;
  if (!value || typeof value !== "object") return null;
  const { sui_amount, pool_token_amount } = value as Record<string, unknown>;
  if (!isU64Numeric(sui_amount) || !isU64Numeric(pool_token_amount)) return null;
  return { sui_amount: String(sui_amount), pool_token_amount: String(pool_token_amount) };
}

/**
 * Historical pool exchange rates, batched.
 *
 * A dynamic field's object id is a pure function of its parent, key and key type, so
 * `deriveDynamicFieldID` computes all of them locally and one `BatchGetObjects` replaces the
 * `GetDynamicField` round trip each (pool, epoch) would otherwise cost. For the whole active
 * validator set that is two requests instead of ~130 — also fewer than the GraphQL arm's chunked
 * 15-alias queries.
 *
 * Derivation is the trade: a scheme change upstream would make every id resolve to nothing, which
 * lands on the same `null` path as a genuinely absent rate — a zero APY, never a wrong one.
 *
 * Returns one entry per lookup, in order. An absent field, an unparseable value or a failed batch
 * yields `null` in place, so one dead pool costs a single validator's APY rather than the whole set.
 *
 * `missing` and `chunksFailed` are reported separately: a null can mean the rate genuinely does not
 * exist for that epoch, or that the server refused a whole batch of up to {@link RATE_BATCH_SIZE}.
 * Those are very different things during a rollout, and collapsing them hides the second.
 */
export const fetchExchangeRatesGrpc = async (
  api: SuiGrpcClient,
  lookups: ReadonlyArray<{ exchangeRatesId: string; epoch: number }>,
): Promise<{ rates: (ExchangeRate | null)[]; missing: number; chunksFailed: number }> => {
  if (lookups.length === 0) return { rates: [], missing: 0, chunksFailed: 0 };

  const ids = lookups.map(lookup =>
    deriveDynamicFieldID(lookup.exchangeRatesId, { u64: true }, u64Key(lookup.epoch)),
  );
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += RATE_BATCH_SIZE) {
    chunks.push(ids.slice(i, i + RATE_BATCH_SIZE));
  }

  let chunksFailed = 0;
  const settled = await promiseAllBatched(RATE_BATCH_CONCURRENCY, chunks, async chunk => {
    try {
      const { objects } = await api.ledgerService.batchGetObjects({
        requests: chunk.map(objectId => ({ objectId })),
        readMask: RATE_FIELD_READ_MASK,
      }).response;

      // Attribution is by object id, never by position. The results are nominally 1:1 with the
      // requests, but a server that omits, reorders or deduplicates a slot would otherwise shift a
      // valid rate onto the wrong pool — a wrong reward or APY, reported with no error at all.
      const byId = new Map<string, ExchangeRate | null>();
      for (const entry of objects ?? []) {
        if (entry.result?.oneofKind !== "object") continue;
        const object = entry.result.object;
        if (!object.objectId) continue;
        byId.set(object.objectId, exchangeRateFromFieldJson(protoValueToJson(object.json)));
      }
      return chunk.map(id => byId.get(id) ?? null);
    } catch {
      chunksFailed++;
      return chunk.map(() => null);
    }
  });

  const rates = settled.flat();
  const missing = rates.filter(rate => rate === null).length;
  return { rates, missing, chunksFailed };
};

/**
 * Active validator set with client-side APY, the gRPC counterpart of `getValidatorsGraphQL`.
 *
 * Sui exposes no APY method on any transport, so the planning and formula are the shared helpers in
 * `network/staking.ts`; only the rate fetch differs per transport.
 */
export const getValidatorsGrpc = async (api: SuiGrpcClient): Promise<SuiValidator[]> => {
  const state = await getSystemStateGrpc(api);
  const { activeValidators, poolToValidator } = fromSystemStateJson(state);
  const poolRefs = poolRefsFromSystemState(state);
  const currentEpoch = Number(state.epoch);

  const plans = planValidatorApyLookups(poolRefs, poolToValidator, currentEpoch);
  const { rates, chunksFailed } = await fetchExchangeRatesGrpc(
    api,
    plans.map(plan => ({ exchangeRatesId: plan.exchangeRatesId, epoch: plan.pastEpoch })),
  );
  const apyByAddress = applyValidatorApy(plans, rates, currentEpoch, chunksFailed, "grpc");

  return activeValidators.map(validator => ({
    ...validator,
    apy: apyByAddress.get(validator.suiAddress) ?? 0,
  }));
};

/** The string form is base64-encoded BCS; the Core API takes raw bytes. */
const toTransactionBytes = (transactionBlock: string | Uint8Array): Uint8Array =>
  typeof transactionBlock === "string" ? fromBase64(transactionBlock) : transactionBlock;

/**
 * Fee simulation, matching `simulateTransactionGraphQL`'s narrow return shape and semantics.
 *
 * `doGasSelection: false` mirrors the GraphQL arm so both fee paths ask the node for the same thing.
 * It does not change `gasBudget`, which comes from the transaction the build step already resolved.
 */
export const simulateTransactionGrpc = async (
  api: SuiGrpcClient,
  transactionBlock: string | Uint8Array,
): Promise<{
  gasBudget: string;
  computationCost: string;
  storageCost: string;
  storageRebate: string;
}> => {
  const result = await api.core.simulateTransaction({
    transaction: toTransactionBytes(transactionBlock),
    include: { effects: true, transaction: true },
    doGasSelection: false,
  });
  const simulated = result.Transaction ?? result.FailedTransaction;
  const gas = simulated?.effects?.gasUsed;
  if (!gas) throw new Error("gRPC SimulateTransaction returned no gas effects");

  return {
    gasBudget: String(simulated?.transaction?.gasData?.budget ?? "0"),
    computationCost: String(gas.computationCost),
    storageCost: String(gas.storageCost),
    storageRebate: String(gas.storageRebate),
  };
};

/**
 * Broadcast, narrowed to the `{ digest, status }` subset every transport exposes.
 *
 * A returned digest alone does not prove success, so the execution status is read from effects and
 * surfaced to the caller rather than assumed.
 */
export const executeTransactionGrpc = async (
  api: SuiGrpcClient,
  transactionBlock: string | Uint8Array,
  signatures: string[],
): Promise<{ digest: string; status?: "success" | "failure"; error?: string }> => {
  const result = await api.core.executeTransaction({
    transaction: toTransactionBytes(transactionBlock),
    signatures,
    include: { effects: true },
  });
  const executed = result.Transaction ?? result.FailedTransaction;
  const status = executed?.effects?.status ?? executed?.status;

  if (!status) return { digest: executed?.digest ?? "" };
  return {
    digest: executed.digest,
    status: status.success ? "success" : "failure",
    ...(status.success ? {} : { error: executionErrorMessage(status.error) }),
  };
};

/** `ExecutedTransaction` fields the response adapter reads, as top-level history paths. */
const HISTORY_READ_MASK = {
  paths: [
    "digest",
    "transaction",
    "effects",
    "events",
    "balance_changes",
    "timestamp",
    "checkpoint",
  ],
};

const affectedAddressFilter = (address: string): GrpcTypes.TransactionFilter => ({
  terms: [
    {
      literals: [
        {
          negated: false,
          predicate: { oneofKind: "affectedAddress", affectedAddress: { address } },
        },
      ],
    },
  ],
});

/**
 * Transactions affecting an address, already projected into the legacy response shape.
 *
 * `affectedAddress` covers sender, sponsor and recipient in one pass, so — unlike the JSON-RPC arm's
 * separate `FromAddress`/`ToAddress` queries — there is no IN/OUT merge or dedupe. `ListTransactions`
 * is server-streaming even though the query is finite, so frames are drained to completion; each
 * carries a resume watermark and the last one seen is the cursor for the next page.
 *
 * `startCheckpoint` is inclusive and `endCheckpoint` exclusive, so a caller resuming past a known
 * checkpoint passes `seq + 1` when ascending but `seq` when descending.
 */
export const listTransactionsByAddressGrpc = async (
  api: SuiGrpcClient,
  params: {
    address: string;
    limit: number;
    order: "asc" | "desc";
    startCheckpoint?: number;
    endCheckpoint?: number;
  },
): Promise<{ transactions: SuiTransactionBlockResponse[]; cursor?: Uint8Array }> => {
  const call = api.ledgerService.listTransactions({
    filter: affectedAddressFilter(normalizeSuiAddress(params.address)),
    readMask: HISTORY_READ_MASK,
    // Ordering enum: ASCENDING = 0, DESCENDING = 1.
    options: { limit: params.limit, ordering: params.order === "asc" ? 0 : 1 },
    ...(params.startCheckpoint !== undefined && {
      startCheckpoint: BigInt(params.startCheckpoint),
    }),
    ...(params.endCheckpoint !== undefined && { endCheckpoint: BigInt(params.endCheckpoint) }),
  });

  const transactions: SuiTransactionBlockResponse[] = [];
  let cursor: Uint8Array | undefined;
  for await (const frame of call.responses) {
    if (frame.watermark?.cursor) cursor = frame.watermark.cursor;
    if (frame.transaction) transactions.push(grpcTxToJsonRpcResponse(frame.transaction));
  }

  return { transactions, ...(cursor && { cursor }) };
};

/**
 * Checkpoint digests for a page of history, keyed by sequence number.
 *
 * `ExecutedTransaction` carries the checkpoint sequence but not its digest, which the operation
 * mapper needs for `blockHash`. Reusing the page's own affected-address filter restricts the stream
 * to the checkpoints holding this address's transactions, so the cost is one streamed call per page
 * rather than JSON-RPC's per-checkpoint fan-out.
 *
 * `limit` must be the transaction limit the page was requested with: every matching checkpoint in
 * the range holds at least one transaction from that page, so that count is a sufficient bound.
 *
 * Never throws — the caller keeps its synthetic fallback for whatever is missing.
 */
export const fetchCheckpointDigestsGrpc = async (
  api: SuiGrpcClient,
  params: { address: string; sequences: number[]; limit: number },
): Promise<Map<string, string>> => {
  const digests = new Map<string, string>();
  if (params.sequences.length === 0) return digests;

  try {
    const call = api.ledgerService.listCheckpoints({
      filter: affectedAddressFilter(normalizeSuiAddress(params.address)),
      readMask: { paths: ["sequence_number", "digest"] },
      startCheckpoint: BigInt(Math.min(...params.sequences)),
      // `end_checkpoint` is exclusive.
      endCheckpoint: BigInt(Math.max(...params.sequences) + 1),
      options: { limit: params.limit },
    });
    for await (const frame of call.responses) {
      const checkpoint = frame.checkpoint;
      if (checkpoint?.sequenceNumber === undefined || !checkpoint.digest) continue;
      digests.set(checkpoint.sequenceNumber.toString(), checkpoint.digest);
    }
  } catch (error) {
    log("coin-sui", "gRPC ListCheckpoints failed; block hashes fall back to synthetic", { error });
  }

  return digests;
};

/** Checkpoint holding a transaction, for translating a digest cursor into a checkpoint bound. */
export const resolveCheckpointForDigestGrpc = async (
  api: SuiGrpcClient,
  digest: string,
): Promise<number | null> => {
  try {
    const { response } = await api.ledgerService.getTransaction({
      digest,
      readMask: { paths: ["checkpoint"] },
    });
    const checkpoint = response.transaction?.checkpoint;
    return checkpoint === undefined ? null : Number(checkpoint);
  } catch {
    // An unknown digest is not fatal: the caller falls back to an unbounded page.
    return null;
  }
};

/** Canonical `StakedSui` struct tag; `object_type` filters are matched in canonical form. */
const STAKED_SUI_TYPE = `0x${"0".repeat(63)}3::staking_pool::StakedSui`;

/** Matches the GraphQL arm's `STAKES_PAGE_SIZE`. */
const STAKES_PAGE_SIZE = 50;

/** Owned `StakedSui` objects as Move JSON, paginated. Malformed entries are skipped, not fatal. */
async function listStakedSuiGrpc(
  api: SuiGrpcClient,
  owner: string,
): Promise<{ items: StakedSuiJson[]; malformed: number }> {
  const items: StakedSuiJson[] = [];
  let malformed = 0;
  let pageToken: Uint8Array | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await api.stateService.listOwnedObjects({
      owner,
      objectType: STAKED_SUI_TYPE,
      pageSize: STAKES_PAGE_SIZE,
      ...(pageToken && { pageToken }),
      readMask: { paths: ["object_id", "object_type", "json"] },
    }).response;

    for (const object of res.objects ?? []) {
      const json = protoValueToJson(object.json);
      if (isStakedSuiJson(json)) items.push(json);
      else if (json !== null && json !== undefined) malformed++;
    }

    if (!res.nextPageToken?.length) return { items, malformed };
    pageToken = res.nextPageToken;
  }

  throw new Error(
    `sui: ListOwnedObjects exceeded ${MAX_PAGES} pages of StakedSui for ${owner} — server next_page_token may be misreporting`,
  );
}

/**
 * Delegated stakes with estimated rewards, the gRPC counterpart of `getDelegatedStakesGraphQL`.
 *
 * Sui exposes no `getStakes` equivalent on gRPC, so the stake state is reconstructed: list the owner's
 * `StakedSui` objects, read each pool's activation-epoch exchange rate, and run the shared
 * pool-token maths. Rates that fail to resolve leave `estimatedReward` at `"0"` rather than failing
 * the whole list — the same degradation the GraphQL arm applies.
 */
export const getDelegatedStakesGrpc = async (
  api: SuiGrpcClient,
  owner: string,
): Promise<DelegatedStake[]> => {
  const ownerAddr = normalizeSuiAddress(owner);
  const state = await getSystemStateGrpc(api);
  const { poolToValidator } = fromSystemStateJson(state);
  const poolRefs = poolRefsFromSystemState(state);

  const { items, malformed } = await listStakedSuiGrpc(api, ownerAddr);
  const plans = planActivationRateLookups(items, BigInt(state.epoch), poolRefs);

  const { rates, missing, chunksFailed } = await fetchExchangeRatesGrpc(
    api,
    plans.wantedEntries.map(entry => ({
      exchangeRatesId: entry.table,
      epoch: Number(entry.epoch),
    })),
  );
  // `wantedEntries` carries the key `computeStakeRewards` looks rates up by, and the fetcher
  // preserves input order, so index alignment is what pairs them.
  const rateMap = new Map(plans.wantedEntries.map((entry, index) => [entry.key, rates[index]]));

  if (malformed > 0 || missing > 0 || chunksFailed > 0) {
    log("warn", "sui-grpc:stake-fetch-degraded", {
      source: "grpc-delegated-stakes",
      malformed,
      ratesMissing: missing,
      chunksFailed,
      total: items.length,
    });
  }

  const rewards = computeStakeRewards(plans.activeStakes, poolRefs, rateMap);
  return groupStakedSuiByPool(items, state.epoch, poolToValidator, "grpc", rewards);
};

/** Minimal event view the staking extractor consumes — mirrors JSON-RPC's `{ type, parsedJson }`. */
type StakingEventLike = { type?: string; parsedJson?: unknown };

/**
 * Events for one transaction, read through the SDK's transport-agnostic Core API rather than
 * the raw `ExecutedTransaction`. Core normalises the proto oneofs and enums that the GraphQL
 * adapter has to unpick by hand, so this stays a field rename rather than a proto mapping.
 *
 * Core's `Event.json` carries the parsed Move struct; the SDK warns its field names can differ
 * per transport, but the staking extractor reads `validator_address`/`amount`, which the gRPC
 * rendering matches — asserted against live transactions in the parity suite.
 */
export const getStakingEventsByDigestGrpc = async (
  api: SuiGrpcClient,
  digest: string,
): Promise<StakingEventLike[]> => {
  const result = await api.core.getTransaction({ digest, include: { events: true } });
  const transaction = result.Transaction ?? result.FailedTransaction;

  return (transaction?.events ?? []).map(event => ({
    // Struct tags arrive canonical; downstream compares against short staking-event constants.
    type: toShortStructTag(event.eventType),
    parsedJson: event.json ?? undefined,
  }));
};

/**
 * gRPC counterpart of `getAllBalancesCachedGraphQL`, producing the same `CoinBalance[]`.
 *
 * `Balance.balance` is the SIP-58 total (address balance + coin objects) and
 * `Balance.address_balance` the address-balance share, matching what the GraphQL arm reads
 * from `totalBalance`/`addressBalance`. `coinObjectCount` and `lockedBalance` are JSON-RPC-only
 * and get the same neutral fillers — `DispatchedCoinBalance` narrows them away downstream.
 */
export const getAllBalancesGrpc = async (
  api: SuiGrpcClient,
  owner: string,
): Promise<CoinBalance[]> => {
  // gRPC rejects short addresses the same way GraphQL's `SuiAddress!` does.
  const ownerAddr = normalizeSuiAddress(owner);
  const balances: CoinBalance[] = [];
  let pageToken: Uint8Array | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await api.stateService.listBalances({
      owner: ownerAddr,
      pageSize: BALANCES_PAGE_SIZE,
      ...(pageToken && { pageToken }),
    }).response;

    for (const balance of res.balances) {
      // Drop entries with no coin type: the field is optional on the wire and a missing
      // identifier would surface as a malformed entry downstream.
      if (!balance.coinType) continue;
      balances.push({
        // gRPC returns canonical 32-byte tags; consumers compare against `DEFAULT_COIN_TYPE`.
        coinType: toShortStructTag(balance.coinType),
        coinObjectCount: 0,
        totalBalance: (balance.balance ?? 0n).toString(),
        lockedBalance: {},
        fundsInAddressBalance: (balance.addressBalance ?? 0n).toString(),
      });
    }

    if (!res.nextPageToken?.length) return balances;
    pageToken = res.nextPageToken;
  }

  throw new Error(
    `sui: ListBalances exceeded ${MAX_PAGES} pages for ${ownerAddr} — server next_page_token may be misreporting`,
  );
};
