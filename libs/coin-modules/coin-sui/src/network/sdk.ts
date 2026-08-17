import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
  Operation as Op,
  Page,
  Stake,
  StakeState,
  Cursor,
} from "@ledgerhq/coin-module-framework/api/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { getInputObjects } from "@mysten/signers/ledger";
import {
  BalanceChange,
  Checkpoint,
  CoinBalance,
  DelegatedStake,
  ExecuteTransactionBlockParams,
  JsonRpcHTTPTransport,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  StakeObject,
  SuiCallArg,
  SuiJsonRpcClient,
  SuiTransaction,
  SuiTransactionBlockKind,
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
  TransactionBlockData,
  TransactionEffects,
} from "@mysten/sui/jsonRpc";
import type { ClientWithCoreApi } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { makeSuiClientFromGraphQL } from "./graphql/sui-client-adapter";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";
import uniqBy from "lodash/unionBy";
import { type SuiCoinConfig, type SuiTransport } from "../config";
import { BLOCK_HEIGHT, ONE_SUI } from "../constants";
import type {
  CoreTransaction,
  CreateExtrinsicArg,
  Resolution,
  SuiStakingExtra,
  SuiValidator,
  Transaction as TransactionType,
} from "../types";
import { ensureAddressFormat, toShortStructTag, normalizeSuiAddressForComparison } from "../utils";
import { fetcher, inferNetworkFromUrl } from "./fetcher";
import { mapDryRunError } from "../logic/mapDryRunError";
import {
  type AsyncGraphQLApiFunction,
  executeTransactionGraphQL,
  getAllBalancesCachedGraphQL,
  getBlockGraphQL,
  getBlockInfoFieldsGraphQL,
  getCheckpointGraphQL,
  getLastBlockGraphQL,
  getDelegatedStakesGraphQL,
  getStakingEventsByDigestGraphQL,
  getTransactionsByAddressGraphQL,
  getTransactionsWithCheckpointDigestsGraphQL,
  getValidatorsGraphQL,
  resolveCheckpointSequenceForDigestGraphQL,
  simulateTransactionGraphQL,
  withGraphQLApi,
} from "./sdk.graphql";
import {
  type AsyncGrpcApiFunction,
  getAllBalancesGrpc,
  getBlockGrpc,
  getCheckpointGrpc,
  executeTransactionGrpc,
  getDelegatedStakesGrpc,
  fetchCheckpointDigestsGrpc,
  grpcPageMayHaveMore,
  listHistoryByAddressGrpc,
  listTransactionsByAddressGrpc,
  resolveCheckpointForDigestGrpc,
  simulateTransactionGrpc,
  getLastBlockGrpc,
  getStakingEventsByDigestGrpc,
  getValidatorsGrpc,
  withGrpcApi,
} from "./sdk.grpc";

type AsyncApiFunction<T> = (api: SuiJsonRpcClient) => Promise<T>;

/**
 * Single source of truth consulted by every `withTransport` dispatcher. Selects which
 * endpoint the read paths (balances, stakes, last block, checkpoint, operations,
 * validators) and write paths (transaction construction, fee dry-run, broadcast) use.
 *
 * Defaults to `json` when unset so a missing config can never silently change transport.
 * The one caller that steps outside the dispatcher is the digest-id lookup in
 * `getBlockInfo`/`getBlock`, and only on GraphQL, whose `checkpoint(...)` takes sequence numbers
 * alone. Device signing goes through {@link withCoreApi}, so it follows the flag like everything else.
 */
export function getTransport(config: SuiCoinConfig): SuiTransport {
  return config.features?.transport ?? "json";
}

export function isGraphQLEnabled(config: SuiCoinConfig): boolean {
  return getTransport(config) === "graphql";
}

export const TRANSACTIONS_LIMIT_PER_QUERY = 50;
export const TRANSACTIONS_LIMIT = 300;

export const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

const STAKING_REQUEST_EVENT = "0x3::validator::StakingRequestEvent";
const UNSTAKING_REQUEST_EVENT = "0x3::validator::UnstakingRequestEvent";

/**
 * Default options for querying transactions.
 *
 * `showEvents` is enabled at sync time so the staking events (DELEGATE:
 * `StakingRequestEvent.amount`; UNDELEGATE: `UnstakingRequestEvent.principal_amount`,
 * both with `validator_address`) can be parsed straight into `op.extra` —
 * eliminates the per-operation by-digest re-fetch that `getOperationExtra` used
 * to do on every operation-details drawer open.
 */
const TRANSACTIONS_QUERY_OPTIONS: SuiTransactionBlockResponseOptions = {
  showInput: true,
  showBalanceChanges: true,
  showEffects: true, // To get transaction status and gas fee details
  showEvents: true,
};

/** Fresh JSON-RPC client per call — SuiJsonRpcClient is stateless. */
export async function withApi<T>(config: SuiCoinConfig, execute: AsyncApiFunction<T>) {
  const url = config.node.url;
  const network = inferNetworkFromUrl(url);
  const transport = new JsonRpcHTTPTransport({
    url,
    fetch: fetcher,
  });

  const api = new SuiJsonRpcClient({ transport, network });
  return execute(api);
}

export function withTransport<T>(
  config: SuiCoinConfig,
  impls: {
    jsonRpc: AsyncApiFunction<T>;
    graphql: AsyncGraphQLApiFunction<T>;
    grpc: AsyncGrpcApiFunction<T>;
  },
): Promise<T> {
  switch (getTransport(config)) {
    case "grpc":
      return withGrpcApi(config, impls.grpc);
    case "graphql":
      return withGraphQLApi(config, impls.graphql);
    default:
      return withApi(config, impls.jsonRpc);
  }
}

/**
 * Dispatches to the selected transport and hands the callback a `ClientWithCoreApi` — the SDK's
 * transport-agnostic client surface. JSON-RPC and gRPC clients implement it directly; GraphQL goes
 * through the adapter. For callers that need a client rather than a wire protocol, this keeps them
 * free of any single transport so each one can be retired independently.
 */
export function withCoreApi<T>(
  config: SuiCoinConfig,
  execute: (client: ClientWithCoreApi) => Promise<T>,
): Promise<T> {
  return withTransport(config, {
    jsonRpc: execute,
    graphql: api => execute(makeSuiClientFromGraphQL(api)),
    grpc: execute,
  });
}

/**
 * Subset every transport populates. Narrows the dispatcher's surface so the
 * GraphQL path's neutral fillers for JSON-RPC-only fields (`coinObjectCount`,
 * `lockedBalance`) can't leak to a future caller via the cached value.
 */
export type DispatchedCoinBalance = Pick<
  CoinBalance,
  "coinType" | "totalBalance" | "fundsInAddressBalance"
>;

const toDispatchedCoinBalance = (b: CoinBalance): DispatchedCoinBalance => ({
  coinType: b.coinType,
  totalBalance: b.totalBalance,
  // `exactOptionalPropertyTypes` rejects an explicit `undefined`; conditional
  // spread preserves the optionality contract of `DispatchedCoinBalance`.
  ...(b.fundsInAddressBalance !== undefined && {
    fundsInAddressBalance: b.fundsInAddressBalance,
  }),
});

/**
 * Cached `suix_getAllBalances` / `Address.balances`. Post-SIP-58 surfaces
 * `fundsInAddressBalance`; the GraphQL path paginates `BalanceConnection`
 * and remaps each node into the shared {@link DispatchedCoinBalance} shape.
 */
export const getAllBalancesCached = makeLRUCache(
  async (config: SuiCoinConfig, owner: string): Promise<DispatchedCoinBalance[]> => {
    // Pick<> is compile-time only — explicitly project every transport's result
    // so the cache never stores transport-specific fields (`coinObjectCount`,
    // `lockedBalance` from JSON-RPC; GraphQL's neutral fillers for the same).
    const balances = await withTransport(config, {
      jsonRpc: api => api.getAllBalances({ owner }),
      graphql: api => getAllBalancesCachedGraphQL(api, owner),
      grpc: api => getAllBalancesGrpc(api, owner),
    });
    return balances.map(toDispatchedCoinBalance);
  },
  // Key includes the transport so flipping the flag mid-rollout doesn't
  // cross-pollinate cached entries between transports. The network is derived from the node URL
  // so cached entries stay scoped per environment.
  // Inputs are colon-free (owner = `0x` + hex; network and transport are fixed enums).
  (config: SuiCoinConfig, owner: string) =>
    `${inferNetworkFromUrl(config.node.url)}:${getTransport(config)}:${owner}`,
  minutes(1),
);

type ProgrammableTransaction = {
  inputs: SuiCallArg[];
  kind: "ProgrammableTransaction";
  transactions: SuiTransaction[];
};

function hasMoveCallWithFunction(
  functionName: string,
  block?: SuiTransactionBlockKind,
): block is ProgrammableTransaction {
  if (block?.kind === "ProgrammableTransaction") {
    const move = block.transactions.find(
      item => "MoveCall" in item && item["MoveCall"].function === functionName,
    ) as any;
    return Boolean(move);
  } else {
    return false;
  }
}

function isStaking(block?: SuiTransactionBlockKind): block is ProgrammableTransaction {
  return hasMoveCallWithFunction("request_add_stake", block);
}

function isUnstaking(block?: SuiTransactionBlockKind): block is ProgrammableTransaction {
  return hasMoveCallWithFunction("request_withdraw_stake", block);
}

/**
 * SIP-58 settlement transactions are system-generated transactions that update
 * accumulator state at checkpoint boundaries.  They can be identified by a
 * mutable reference to the root accumulator object `0xacc` in their inputs.
 *
 * RPC returns object ids in canonical 32-byte padded form (`0x0000…0acc` — e.g.
 * mainnet settlement tx `8th3QUBRS4kXxNrXXgVb8oH85NFEprXk3DXqGQjv7YiN`), so
 * inputs are normalized to the short form before comparing.
 *
 * These are internal bookkeeping transactions and should be excluded from the
 * user-facing operations history.
 */
const ACCUMULATOR_ROOT_OBJECT_ID = "0xacc";

export function isSettlementTransaction(tx: SuiTransactionBlockResponse): boolean {
  const block = tx.transaction?.data?.transaction;
  if (block?.kind !== "ProgrammableTransaction") return false;

  return block.inputs.some(
    input =>
      input.type === "object" &&
      "objectType" in input &&
      input.objectType === "sharedObject" &&
      input.mutable === true &&
      toShortStructTag(input.objectId) === ACCUMULATOR_ROOT_OBJECT_ID,
  );
}

/**
 * gRPC counterpart of the GraphQL arm's `isFinalizedTxNode`.
 *
 * `ListTransactions` is meant to return executed transactions only, but the mapper leaves
 * `timestampMs` unset when the proto omits it, and such a record becomes an operation dated 1970 —
 * sorted to the bottom of the account's history and unusable as a pagination cursor, which reads as
 * the end of history. The GraphQL arm drops the equivalent records rather than mapping them.
 */
const isFinalizedGrpcTx = (tx: SuiTransactionBlockResponse): boolean =>
  tx.timestampMs !== null && tx.timestampMs !== undefined;

/**
 * Accumulator events report `ty` as `0x2::balance::Balance<INNER>`, while
 * `BalanceChange.coinType` uses the bare `INNER` form. Normalise to the inner
 * coin type so the two can be compared and merged.
 */
function stripBalanceWrapper(ty: string): string {
  const m = ty.match(/^0x2::balance::Balance<(.+)>$/);
  return m ? m[1] : ty;
}

/**
 * SIP-58: Merge accumulator events from `effects.accumulatorEvents` into the
 * standard `balanceChanges` array so that deposits to address balances (which
 * may not appear in coin-object-level balance changes) are visible in the
 * operations history.
 *
 * For each accumulator event we check whether `balanceChanges` already has an
 * entry for the same (address, coinType) pair.  If it does, the RPC already
 * accounted for the accumulator; otherwise we synthesise a new BalanceChange.
 */
export function getUnifiedBalanceChanges(tx: SuiTransactionBlockResponse): BalanceChange[] {
  const base = tx.balanceChanges ?? [];
  const accEvents = tx.effects?.accumulatorEvents;
  if (!accEvents || accEvents.length === 0) return base;

  const extra: BalanceChange[] = [];

  for (const evt of accEvents) {
    if (!("integer" in evt.value)) continue;

    const coinType = stripBalanceWrapper(toShortStructTag(evt.ty));
    const amount = evt.operation === "merge" ? evt.value.integer : `-${evt.value.integer}`;
    const alreadyCovered = base.some(
      bc =>
        bc.coinType === coinType &&
        typeof bc.owner !== "string" &&
        "AddressOwner" in bc.owner &&
        bc.owner.AddressOwner === evt.address,
    );

    if (!alreadyCovered) {
      extra.push({
        coinType,
        owner: { AddressOwner: evt.address },
        amount,
      });
    }
  }

  return extra.length > 0 ? [...base, ...extra] : base;
}

export type AccountBalance = {
  coinType: string;
  blockHeight: number;
  balance: BigNumber;
  /**
   * SIP-58 address balance portion (if any).
   * When non-zero, part of `balance` is held directly at the address level
   * rather than in coin objects. The RPC's `suix_getAllBalances` aggregates both
   * sources into `totalBalance`; this field surfaces the split for coin selection.
   */
  fundsInAddressBalance: BigNumber;
};

/**
 * Get account balance (native and tokens).
 *
 * Post SIP-58 the JSON-RPC `suix_getAllBalances` automatically aggregates
 * traditional coin-object balances **and** address-level balances into
 * `totalBalance`. The optional `fundsInAddressBalance` field indicates
 * how much of that total comes from the address balance (used by
 * coin-selection logic in transaction building).
 */
export const getAccountBalances = async (
  config: SuiCoinConfig,
  addr: string,
): Promise<AccountBalance[]> => {
  const balances = await getAllBalancesCached(config, addr);
  return balances.map(({ coinType, totalBalance, fundsInAddressBalance }) => ({
    coinType,
    blockHeight: BLOCK_HEIGHT * 2,
    balance: BigNumber(totalBalance),
    fundsInAddressBalance: BigNumber(fundsInAddressBalance ?? "0"),
  }));
};

/**
 * Returns true if account is the signer
 */
export function isSender(addr: string, transaction?: TransactionBlockData): boolean {
  return transaction?.sender === ensureAddressFormat(addr);
}

/**
 * Map transaction to an Operation Type
 */
export function getOperationType(
  addr: string,
  { transaction }: SuiTransactionBlockResponse,
): OperationType {
  if (!isSender(addr, transaction?.data)) {
    return "IN";
  }
  if (isStaking(transaction?.data.transaction)) {
    return "DELEGATE";
  }
  if (isUnstaking(transaction?.data.transaction)) {
    return "UNDELEGATE";
  }
  return "OUT";
}

/**
 * Extract senders from transaction
 */
export const getOperationSenders = (transaction?: TransactionBlockData): string[] => {
  return transaction?.sender ? [transaction?.sender] : [];
};

/**
 * Extract recipients from transaction
 */
export const getOperationRecipients = (transaction?: TransactionBlockData): string[] => {
  if (!transaction) return [];

  if (transaction.transaction.kind === "ProgrammableTransaction") {
    if (!transaction.transaction.inputs) return [];
    const recipients: string[] = [];
    transaction.transaction.inputs.forEach((input: SuiCallArg) => {
      if ("valueType" in input && input.valueType === "address") {
        recipients.push(String(input.value));
      }
    });
    if (isStaking(transaction.transaction)) {
      const address = transaction.transaction.inputs.find(
        (input: SuiCallArg) => "valueType" in input && input.valueType === "address",
      );
      if (address && address.type === "pure" && address.valueType === "address") {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        recipients.push(address.value as string);
      }
    }
    if (isUnstaking(transaction.transaction)) {
      return [];
    }
    return recipients;
  }
  return [];
};

/**
 * Extract value from transaction
 */
export const getOperationAmount = (
  address: string,
  transaction: SuiTransactionBlockResponse,
  coinType: string,
): BigNumber => {
  const normalizedAddress = normalizeSuiAddressForComparison(address);
  const changes = getUnifiedBalanceChanges(transaction);
  let amount = new BigNumber(0);
  if (changes.length === 0) return amount;
  if (
    isStaking(transaction.transaction?.data.transaction) ||
    isUnstaking(transaction.transaction?.data.transaction)
  ) {
    const balanceChange = changes[0];
    return amount.minus(balanceChange?.amount || 0);
  }

  for (const balanceChange of changes) {
    if (
      typeof balanceChange.owner !== "string" &&
      "AddressOwner" in balanceChange.owner &&
      normalizeSuiAddressForComparison(balanceChange.owner.AddressOwner) === normalizedAddress
    ) {
      if (balanceChange.amount[0] === "-") {
        amount = balanceChange.coinType === coinType ? amount.minus(balanceChange.amount) : amount;
      } else {
        amount = balanceChange.coinType === coinType ? amount.plus(balanceChange.amount) : amount;
      }
    }
  }
  return amount;
};

/**
 * Extract fee from transaction
 */
export const getOperationFee = (transaction: SuiTransactionBlockResponse): BigNumber => {
  const gas = transaction.effects!.gasUsed;

  const computationCost = BigNumber(gas.computationCost);
  const storageCost = BigNumber(gas.storageCost);
  const storageRebate = BigNumber(gas.storageRebate);

  return computationCost.plus(storageCost).minus(storageRebate);
};

/** Minimal view of a Sui event the staking extractor needs: struct tag + parsed Move fields. */
type StakingEventLike = { type?: string; parsedJson?: unknown };

/**
 * Pull `{ validatorAddress, stakedAmount }` out of a transaction's events for an
 * already-known operation kind. The staked-principal field name differs by event
 * (`StakingRequestEvent.amount` vs `UnstakingRequestEvent.principal_amount`, per Sui
 * `sui_system::validator`); both carry `validator_address`. Returns `null` when the
 * matching event or its fields are absent.
 */
function stakingExtraFromEvents(
  events: readonly StakingEventLike[] | null | undefined,
  type: "DELEGATE" | "UNDELEGATE",
): SuiStakingExtra | null {
  const isUnstake = type === "UNDELEGATE";
  const eventType = isUnstake ? UNSTAKING_REQUEST_EVENT : STAKING_REQUEST_EVENT;
  const parsed = events?.find(e => e.type === eventType)?.parsedJson as
    | {
        amount?: string | number;
        principal_amount?: string | number;
        validator_address?: string;
      }
    | undefined;
  const validatorAddress = parsed?.validator_address;
  const rawAmount = isUnstake ? parsed?.principal_amount : parsed?.amount;
  // Sui serializes u64 as a string on every transport; String()-coerce defensively.
  const stakedAmount = String(rawAmount ?? "");
  if (!validatorAddress || !stakedAmount) return null;
  return { validatorAddress, stakedAmount };
}

/**
 * Extract `{ validatorAddress, stakedAmount }` from a staking/unstaking transaction's events for
 * the **bridge** operation (`transactionToOperation`). The event is authoritative and present at
 * sync on every transport (`showEvents: true` on JSON-RPC; the `events` selection in
 * `TRANSACTIONS_BY_AFFECTED_ADDRESS` on GraphQL; the `events` read-mask path on gRPC) — which is
 * what lets the bridge fill `op.extra` and drop the per-drawer re-fetch. Distinct from
 * `getStakingEventDetails` (coin-framework path, different shape). Module-internal; returns `null`
 * when not staking or the fields are absent.
 */
function getStakingExtra(response: SuiTransactionBlockResponse): SuiStakingExtra | null {
  const tx = response.transaction?.data?.transaction;
  if (isStaking(tx)) return stakingExtraFromEvents(response.events, "DELEGATE");
  if (isUnstaking(tx)) return stakingExtraFromEvents(response.events, "UNDELEGATE");
  return null;
}

/**
 * Backfill path for operations synced before staking extras were persisted on `op.extra`: the
 * incremental sync never re-fetches them, so recover the extras on demand by digest. The caller
 * knows the op `type`, so only the transaction's events are fetched, not the whole transaction.
 *
 * Transitional / internal-only: exposed via the `./getStakingExtraByDigest` subpath solely for the
 * live-common drawer hook's legacy fallback; expected to be removed once pre-upgrade operations age
 * out. Not a stable coin-sui API.
 */
export const getStakingExtraByDigest = (
  config: SuiCoinConfig,
  digest: string,
  type: OperationType,
): Promise<SuiStakingExtra | null> => {
  if (type !== "DELEGATE" && type !== "UNDELEGATE") return Promise.resolve(null);
  return withTransport(config, {
    jsonRpc: async api => {
      const response = await api.getTransactionBlock({
        digest,
        options: { showEvents: true },
      });
      return stakingExtraFromEvents(response.events, type);
    },
    graphql: async api => {
      const events = await getStakingEventsByDigestGraphQL(api, digest);
      return stakingExtraFromEvents(events, type);
    },
    grpc: async api => {
      const events = await getStakingEventsByDigestGrpc(api, digest);
      return stakingExtraFromEvents(events, type);
    },
  });
};

/**
 * Extract date from transaction
 */
export const getOperationDate = (transaction: SuiTransactionBlockResponse): Date => {
  return new Date(Number(transaction.timestampMs ?? 0));
};

/**
 * Extract the fees payer from transaction (gasData.owner).
 * For sponsored transactions this is the sponsor; otherwise it is the sender.
 */
export const getFeesPayer = (transaction: SuiTransactionBlockResponse): string | undefined =>
  transaction.transaction?.data?.gasData?.owner || undefined;

/**
 * `DelegatedStake[]` regardless of transport. Only JSON-RPC has a native `getStakes`; GraphQL and
 * gRPC both reconstruct from `StakedSui` objects + system-state (one extra rate lookup per Active
 * stake's pool, deduped), and rate failures degrade `estimatedReward` to `"0"`.
 */
export const getDelegatedStakes = (
  config: SuiCoinConfig,
  owner: string,
): Promise<DelegatedStake[]> =>
  withTransport(config, {
    jsonRpc: api => api.getStakes({ owner }),
    graphql: api => getDelegatedStakesGraphQL(api, owner),
    grpc: api => getDelegatedStakesGrpc(api, owner),
  });

/**
 * Extract operation coin type from transaction
 */
export const getOperationCoinType = (transaction: SuiTransactionBlockResponse): string => {
  const changes = getUnifiedBalanceChanges(transaction);
  if (changes.length === 0) {
    return DEFAULT_COIN_TYPE;
  }
  const tokenBalanceChanges = changes.filter(({ coinType }) => coinType !== DEFAULT_COIN_TYPE);
  if (tokenBalanceChanges.length > 0) {
    return tokenBalanceChanges[0].coinType;
  }
  return DEFAULT_COIN_TYPE;
};

/**
 * Map the Sui history transaction to a Ledger Live Operation
 */
export function transactionToOperation(
  accountId: string,
  address: string,
  transaction: SuiTransactionBlockResponse,
): Operation {
  const type = getOperationType(address, transaction);

  const coinType = getOperationCoinType(transaction);
  const hash = transaction.digest;

  // Eagerly attach staking metadata at sync time so the operation-details
  // drawer can render synchronously from `extra` instead of re-fetching the
  // whole transaction by digest.
  const stakingExtra =
    type === "DELEGATE" || type === "UNDELEGATE" ? getStakingExtra(transaction) : null;

  return {
    id: encodeOperationId(accountId, hash, type),
    accountId,
    // warning this is false:
    blockHash: hash,
    blockHeight: BLOCK_HEIGHT,
    date: getOperationDate(transaction),
    extra: {
      coinType,
      ...(stakingExtra ?? {}),
    },
    fee: getOperationFee(transaction),
    hasFailed: transaction.effects?.status.status !== "success",
    hash,
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: getOperationAmount(address, transaction, coinType),
  };
}

// This function is only used by coin-framework code path
// Logic is similar to getOperationAmount, but we guarantee to return a positive amount in any case
// If there is need to display negative amount for staking or unstaking, the view can handle it based on the type of the operation
export const getOperationAmountCoinFramework = (
  address: string,
  transaction: SuiTransactionBlockResponse,
  coinType: string,
): BigNumber => {
  const zero = BigNumber(0);

  const tx = transaction.transaction?.data.transaction;
  const changes = getUnifiedBalanceChanges(transaction);
  if (isStaking(tx) || isUnstaking(tx)) {
    if (changes.length > 0)
      return removeFeesFromAmountForNative(changes[0], getOperationFee(transaction)).abs();
    return BigNumber(0);
  } else {
    return changes
      .filter(
        balanceChange =>
          typeof balanceChange.owner !== "string" &&
          "AddressOwner" in balanceChange.owner &&
          balanceChange.owner.AddressOwner === address &&
          balanceChange.coinType === coinType,
      )
      .map(change => {
        if (isSender(address, transaction.transaction?.data))
          return removeFeesFromAmountForNative(change, getOperationFee(transaction)).abs();
        else return BigNumber(change.amount).abs();
      })
      .reduce((acc, curr) => acc.plus(curr), zero);
  }
};

/**
 * Extract staking/unstaking event details for the **coin-framework** operation
 * (`transactionToCoinFrameworkOperation`) — distinct from `getStakingExtra` above, which feeds the
 * bridge op a `{ validatorAddress, stakedAmount }`; this returns `stakedObjectId`/`rewardAmount`/
 * `withdrawnAmount`. `StakingRequestEvent` carries no `staked_sui_id`, so `stakedObjectId` is
 * best-effort — the `v !== undefined` filter drops it when absent (the norm) and it's kept for
 * forward-compat. `sdk.integ.test.ts` asserts that real-world absence.
 */
export function getStakingEventDetails(
  transaction: SuiTransactionBlockResponse,
): Record<string, unknown> {
  const stakingDetails = transaction.events?.find(e => e.type === STAKING_REQUEST_EVENT)
    ?.parsedJson as Record<string, string> | undefined;

  if (stakingDetails) {
    return Object.fromEntries(
      Object.entries({
        stakedObjectId: stakingDetails.staked_sui_id,
        validatorAddress: stakingDetails.validator_address,
      }).filter(([, v]) => v !== undefined),
    );
  }

  const unstakingDetails = transaction.events?.find(e => e.type === UNSTAKING_REQUEST_EVENT)
    ?.parsedJson as Record<string, string> | undefined;

  if (unstakingDetails) {
    return Object.fromEntries(
      Object.entries({
        rewardAmount: unstakingDetails.reward_amount
          ? BigInt(unstakingDetails.reward_amount)
          : undefined,
        validatorAddress: unstakingDetails.validator_address,
        withdrawnAmount: unstakingDetails.principal_amount
          ? BigInt(unstakingDetails.principal_amount)
          : undefined,
      }).filter(([, v]) => v !== undefined),
    );
  }

  return {};
}

/**
 * This function is only used by coin-framework code path
 *
 * @returns the operation converted. Note that if param `transaction` was retrieved as an "IN" operations, the type may be converted to "OUT".
 *    It happens for most "OUT" operations because the sender receive a new version of the coin objects.
 */
export function transactionToCoinFrameworkOperation(
  address: string,
  transaction: SuiTransactionBlockResponse,
  checkpointHash?: string,
): Op {
  const type = getOperationType(address, transaction);
  const coinType = getOperationCoinType(transaction);
  const hash = transaction.digest;

  const blockHeight = Number.parseInt(transaction.checkpoint || "0");
  const blockHash =
    checkpointHash || (blockHeight > 0 ? `synthetic-${transaction.checkpoint}` : "");

  const feesPayer = getFeesPayer(transaction);

  const op: Op = {
    id: hash,
    tx: {
      date: getOperationDate(transaction),
      hash,
      fees: BigInt(getOperationFee(transaction).toString()),
      ...(feesPayer ? { feesPayer } : {}),
      block: {
        height: blockHeight,
        hash: blockHash,
        time: getOperationDate(transaction),
      },
      failed: transaction.effects?.status.status !== "success",
    },
    asset: toSuiAsset(coinType),
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: BigInt(getOperationAmountCoinFramework(address, transaction, coinType).toString()),
  };

  if (type === "DELEGATE" || type === "UNDELEGATE") {
    op.details = {
      stakedAmount: op.value,
      ...getStakingEventDetails(transaction),
    };
    // for staking, the amount is stored in the details
    op.value = 0n;
  }

  return op;
}

/**
 * Convert a SUI RPC checkpoint info to a {@link BlockInfo}. Param is narrowed
 * to the four fields actually read so the GraphQL helper output flows through
 * the same mapper without an inline duplicate.
 */
export function toBlockInfo(
  checkpoint: Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs" | "previousDigest">,
): BlockInfo {
  const info: BlockInfo = {
    height: Number(checkpoint.sequenceNumber),
    hash: checkpoint.digest,
    time: new Date(parseInt(checkpoint.timestampMs)),
  };

  if (typeof checkpoint.previousDigest === "string") {
    return {
      ...info,
      parent: {
        height: Number(checkpoint.sequenceNumber) - 1,
        hash: checkpoint.previousDigest,
      },
    };
  }

  return info;
}

/**
 * Convert a SUI RPC transaction block response to a {@link BlockTransaction}.
 *
 * Notes:
 *  - transfers are generated from balance changes rather than effects,
 * therefore the peer is not populated.
 *  - all other operation types are ignored
 *
 * @param transaction SUI RPC transaction block response
 */
export function toBlockTransaction(transaction: SuiTransactionBlockResponse): BlockTransaction {
  const operationFee = getOperationFee(transaction);
  const feesPayer = getFeesPayer(transaction);
  const changes = getUnifiedBalanceChanges(transaction);
  return {
    hash: transaction.digest,
    failed: transaction.effects?.status.status !== "success",
    operations: changes.flatMap(change => toBlockOperation(transaction, change, operationFee)),
    fees: BigInt(operationFee.toString()),
    ...(feesPayer ? { feesPayer } : {}),
  };
}

export function removeFeesFromAmountForNative(change: BalanceChange, fees: BigNumber): BigNumber {
  if (change.coinType === DEFAULT_COIN_TYPE) return BigNumber(change.amount).plus(fees);
  return BigNumber(change.amount);
}

/**
 * Convert a SUI RPC transaction balance change to a {@link BlockOperation}.
 *
 * @param transaction
 * @param change balance change
 * @param fees transaction fees to be deducted from the amount if applicable
 */
export function toBlockOperation(
  transaction: SuiTransactionBlockResponse,
  change: BalanceChange,
  fees: BigNumber,
): BlockOperation[] {
  if (typeof change.owner === "string" || !("AddressOwner" in change.owner)) return [];
  const address = change.owner.AddressOwner;
  const operationType = getOperationType(address, transaction);

  function transferOp(peer: string | undefined, amount: bigint): BlockOperation {
    const op: BlockOperation = {
      type: "transfer",
      address: address,
      asset: toSuiAsset(change.coinType),
      amount: amount,
    };
    if (peer) op.peer = peer;
    return op;
  }

  switch (operationType) {
    case "IN":
      return [
        transferOp(getOperationSenders(transaction.transaction?.data).at(0), BigInt(change.amount)),
      ];
    case "OUT":
      return [
        transferOp(
          getOperationRecipients(transaction.transaction?.data).at(0),
          BigInt(removeFeesFromAmountForNative(change, fees).toString()),
        ),
      ];
    case "DELEGATE":
    case "UNDELEGATE":
      return [
        {
          type: "other",
          operationType: operationType,
          address: change.owner.AddressOwner,
          asset: toSuiAsset(change.coinType),
          stakedAmount: BigInt(removeFeesFromAmountForNative(change, fees).toString()),
        },
      ];
    default:
      return [
        {
          type: "transfer",
          address: address,
          asset: toSuiAsset(change.coinType),
          amount: BigInt(change.amount),
        },
      ];
  }
}

/**
 * Convert a SUI coin type to a {@link SuiAsset}.
 *
 * @param coinType coin type, as returned from SUI RPC
 */
export function toSuiAsset(coinType: string): AssetInfo {
  switch (coinType) {
    case DEFAULT_COIN_TYPE:
      return { type: "native" };
    default:
      return { type: "token", assetReference: coinType };
  }
}

export const getLastBlock = (
  config: SuiCoinConfig,
): Promise<{ digest: string; sequenceNumber: string; timestampMs: string }> =>
  withTransport(config, {
    jsonRpc: async api => {
      const checkpoint = await api.getLatestCheckpointSequenceNumber();
      const { digest, sequenceNumber, timestampMs } = await api.getCheckpoint({
        id: checkpoint,
      });
      return { digest, sequenceNumber, timestampMs };
    },
    graphql: getLastBlockGraphQL,
    grpc: async api => {
      const { digest, sequenceNumber, timestampMs } = await getLastBlockGrpc(api);
      return { digest, sequenceNumber, timestampMs };
    },
  });

/**
 * Paginated transaction history. JSON-RPC: two parallel `queryTransactionBlocks`
 * calls (FromAddress + ToAddress) merged + deduped by `filterOperations`.
 * GraphQL: a single `transactions(filter: { affectedAddress })` query covers
 * sender/sponsor/recipient in one round-trip (no IN+OUT merge needed). gRPC:
 * `ListTransactions` streams on the affected-address filter, same single-pass shape.
 *
 * All three arms accumulate up to `TRANSACTIONS_LIMIT` operations, walking pages of
 * `TRANSACTIONS_LIMIT_PER_QUERY`.
 */
export const getOperations = async (
  config: SuiCoinConfig,
  accountId: string,
  addr: string,
  cursor?: QueryTransactionBlocksParams["cursor"],
  order?: "asc" | "desc",
): Promise<Operation[]> =>
  withTransport(config, {
    jsonRpc: async api => {
      let rpcOrder: "ascending" | "descending";
      if (order) {
        rpcOrder = order === "asc" ? "ascending" : "descending";
      } else {
        rpcOrder = cursor ? "ascending" : "descending";
      }

      const sendOps = await loadOperations({
        api,
        addr,
        type: "OUT",
        cursor,
        order: rpcOrder,
        operations: [],
      });
      const receivedOps = await loadOperations({
        api,
        addr,
        type: "IN",
        cursor,
        order: rpcOrder,
        operations: [],
      });
      // When restoring state (no cursor provided) we filter out extra operations to maintain correct chronological order
      const rawTransactions = filterOperations(sendOps, receivedOps, rpcOrder, !cursor);

      return rawTransactions.operations
        .filter(tx => !isSettlementTransaction(tx))
        .map(transaction => transactionToOperation(accountId, addr, transaction));
    },
    graphql: async api => {
      // The bridge passes `cursor = latestHash(operations) = transaction.digest` (see
      // `bridge/synchronisation.ts` + `transactionToOperation`), which is a Sui digest
      // — NOT an opaque GraphQL connection cursor. Translate it to a server-side
      // `afterCheckpoint` filter so incremental sync returns only newer ops.
      //
      // The bound keeps the cursor's own checkpoint in range: it can hold several of this address's
      // transactions and the previous sync may have stopped partway through them, so excluding it
      // would strand the rest. Re-delivered operations are harmless — `mergeOps` dedupes by id and
      // documents that it expects overlap with what the account already has.
      const cursorDigest = typeof cursor === "string" ? cursor : null;
      let filter: { afterCheckpoint?: number } | undefined;
      if (cursorDigest) {
        const seq = await resolveCheckpointSequenceForDigestGraphQL(api, cursorDigest);
        // `afterCheckpoint` is exclusive, so keeping checkpoint `seq` in range means bounding at
        // `seq - 1`. At genesis there is nothing below to exclude, and `afterCheckpoint: 0` would
        // exclude checkpoint 0 itself — so the bound is dropped instead.
        if (seq !== null && seq > 0) filter = { afterCheckpoint: seq - 1 };
      }
      // The server caps `last` at 50, so pages of that size accumulate up to `TRANSACTIONS_LIMIT` —
      // the depth the JSON-RPC arm reaches through `loadOperations`. A single page would cap the
      // account at its newest 50 operations permanently: this path runs once per sync and always
      // resumes from the newest stored digest, so what it skips is never requested again.
      // Ascending only once the cursor gave a real lower bound, so the operations `limit` leaves
      // unread stay newer than the resume point the caller stores. Without a bound — a first sync, or
      // a digest this index no longer holds — ascending would read the oldest slice of all history
      // and never reach the recent operations, so the walk stays descending from the tip.
      const { items } = await getTransactionsByAddressGraphQL(
        api,
        addr,
        TRANSACTIONS_LIMIT,
        TRANSACTIONS_LIMIT_PER_QUERY,
        null,
        filter,
        filter?.afterCheckpoint === undefined ? "desc" : "asc",
      );
      return items
        .filter(tx => !isSettlementTransaction(tx))
        .sort(compareOperations("desc"))
        .map(transaction => transactionToOperation(accountId, addr, transaction));
    },
    grpc: async api => {
      // Same digest-cursor translation as the GraphQL arm, and the same inclusive bound:
      // `startCheckpoint` is inclusive, so passing the cursor's checkpoint keeps its unsynced
      // siblings in range. `mergeOps` dedupes the ones already stored.
      const cursorDigest = typeof cursor === "string" ? cursor : null;
      let startCheckpoint: number | undefined;
      if (cursorDigest) {
        const seq = await resolveCheckpointForDigestGrpc(api, cursorDigest);
        if (seq !== null) startCheckpoint = seq;
      }
      // Same depth as the GraphQL arm above, which documents why one page is not enough. The
      // direction follows the JSON-RPC arm: descending from the tip for a first sync, ascending from
      // the cursor for a resumed one, so the operations `limit` leaves unread stay newer than the
      // resume point the caller stores — see {@link listHistoryByAddressGrpc}.
      const transactions = await listHistoryByAddressGrpc(api, {
        address: addr,
        limit: TRANSACTIONS_LIMIT,
        pageSize: TRANSACTIONS_LIMIT_PER_QUERY,
        order: startCheckpoint === undefined ? "desc" : "asc",
        ...(startCheckpoint !== undefined && { startCheckpoint }),
      });
      return transactions
        .filter(tx => isFinalizedGrpcTx(tx) && !isSettlementTransaction(tx))
        .sort(compareOperations("desc"))
        .map(transaction => transactionToOperation(accountId, addr, transaction));
    },
  });

export const filterOperations = (
  sendOps: LoadOperationResponse,
  receiveOps: LoadOperationResponse,
  _order: "ascending" | "descending",
  shouldFilter: boolean = true,
): LoadOperationResponse => {
  let filterTimestamp: number = 0;
  let nextCursor: string | null | undefined = undefined;
  // When we've reached the limit for either sent or received operations,
  // we filter out extra operations to maintain correct chronological order
  if (
    shouldFilter &&
    sendOps.operations.length &&
    receiveOps.operations.length &&
    (sendOps.operations.length === TRANSACTIONS_LIMIT ||
      receiveOps.operations.length === TRANSACTIONS_LIMIT)
  ) {
    const sendTime = Number(sendOps.operations[sendOps.operations.length - 1].timestampMs ?? 0);
    const receiveTime = Number(
      receiveOps.operations[receiveOps.operations.length - 1].timestampMs ?? 0,
    );
    if (sendTime >= receiveTime) {
      nextCursor = sendOps.cursor;
      filterTimestamp = sendTime;
    } else {
      nextCursor = receiveOps.cursor;
      filterTimestamp = receiveTime;
    }
  }
  const result = [...sendOps.operations, ...receiveOps.operations]
    .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
    .filter(op => Number(op.timestampMs) >= filterTimestamp);

  return { operations: uniqBy(result, tx => tx.digest), cursor: nextCursor };
};

function convertApiOrderToSdkOrder(order: "asc" | "desc"): "ascending" | "descending" {
  return order === "asc" ? "ascending" : "descending";
}

function toSdkCursor(cursor: string | undefined): QueryTransactionBlocksParams["cursor"] {
  const ret: QueryTransactionBlocksParams["cursor"] = cursor;
  return ret;
}

function compareOperations(
  order: "asc" | "desc",
): (a: SuiTransactionBlockResponse, b: SuiTransactionBlockResponse) => number {
  return (a, b) =>
    compareTimestampAndDigest(
      order,
      Number(a.timestampMs ?? 0),
      a.digest ?? "",
      Number(b.timestampMs ?? 0),
      b.digest ?? "",
    );
}

function compareTimestampAndDigest(
  order: "asc" | "desc",
  timestampA: number,
  digestA: string,
  timestampB: number,
  digestB: string,
): number {
  if (timestampA !== timestampB)
    return order === "asc" ? timestampA - timestampB : timestampB - timestampA;
  if (digestA === digestB) return 0;
  if (order === "asc") return digestA < digestB ? -1 : 1;
  return digestA > digestB ? -1 : 1;
}

function isStrictlyAfterCursor(
  op: SuiTransactionBlockResponse,
  cursor: ListOperationsCursor,
  order: "asc" | "desc",
): boolean {
  if (op.digest === cursor.digest) return false;
  return (
    compareTimestampAndDigest(
      order,
      Number(op.timestampMs ?? 0),
      op.digest ?? "",
      cursor.timestamp,
      cursor.digest,
    ) > 0
  );
}

/**
 * Removes operations the previous page already delivered. Both history arms rely on this, and it is
 * why their server-side checkpoint bounds must *include* the cursor's own checkpoint:
 *
 * A checkpoint can hold several transactions for one address, and they share its `timestampMs`, so
 * the cursor comparison falls through to the digest tie-break. A page boundary can therefore land
 * inside a checkpoint. Excluding that checkpoint from the next query drops its remainder for good —
 * this filter can only remove what the server returned, never recover what it withheld.
 *
 * The cost of including it is a page of already-seen items. That is fine except when one checkpoint
 * holds a full page of the address's transactions, where nothing survives the filter and pagination
 * would end early; each arm then steps its bound past that checkpoint once.
 *
 * It also follows that a page's surviving count says nothing about whether history remains: the
 * resume point is re-fetched and dropped every time, so a cursor-fed page never reaches the page size
 * even mid-history. Each arm therefore takes "is there more?" from the server.
 */
function dropOperationsBeforeCursor(params: {
  operations: SuiTransactionBlockResponse[];
  order: "asc" | "desc";
  cursor: ListOperationsCursor | null;
}): SuiTransactionBlockResponse[] {
  const { operations, order, cursor } = params;
  if (!cursor) return operations;
  return operations.filter(op => isStrictlyAfterCursor(op, cursor, order));
}

function dropOperationsAfterNextCursor(params: {
  order: "asc" | "desc";
  cursor: Cursor | undefined;
  pageOps: SuiTransactionBlockResponse[];
  outOps: PaginatedTransactionResponse;
  inOps: PaginatedTransactionResponse;
}): {
  operations: SuiTransactionBlockResponse[];
  nextCursor: Cursor | undefined;
} {
  const { order, cursor, pageOps, outOps, inOps } = params;

  // if both sides on last page => no filtering or next cursor needed
  if (!(outOps.hasNextPage || inOps.hasNextPage))
    return { operations: pageOps, nextCursor: undefined };

  // determine boundary operation for next cursor
  const lastOps: SuiTransactionBlockResponse[] = [
    getLastOperation(outOps.data),
    getLastOperation(inOps.data),
  ].filter(op => op !== undefined);
  if (lastOps.length === 0) return { operations: pageOps, nextCursor: undefined };
  const nextCursorBoundaryOp = lastOps.reduce((selected, current) =>
    compareOperations(order)(current, selected) < 0 ? current : selected,
  );

  // drop all operations after next cursor
  const opsBeforeNextCursor = pageOps.filter(
    op => compareOperations(order)(op, nextCursorBoundaryOp) <= 0,
  );

  // serialize next cursor
  const nextCursorCandidate = serializeListOperationsCursor({
    digest: nextCursorBoundaryOp.digest,
    timestamp: Number(nextCursorBoundaryOp.timestampMs ?? 0),
  });

  // defensive guard to avoid infinite loop in case the API returns unexpected results
  const nextCursor = nextCursorCandidate === cursor ? undefined : nextCursorCandidate;

  return { operations: opsBeforeNextCursor, nextCursor };
}

function getLastOperation(
  operations: SuiTransactionBlockResponse[],
): SuiTransactionBlockResponse | undefined {
  return operations.length > 0 ? operations[operations.length - 1] : undefined;
}

type ListOperationsCursor = {
  digest: string;
  timestamp: number;
};

function serializeListOperationsCursor(cursor: ListOperationsCursor): string {
  return `${cursor.timestamp}:${cursor.digest}`;
}

function parseListOperationsCursor(cursor: string | undefined): ListOperationsCursor | null {
  if (!cursor) return null;

  const sepIdx = cursor.indexOf(":");
  if (sepIdx <= 0 || sepIdx === cursor.length - 1) {
    throw new Error("Invalid list operations cursor format: missing timestamp or digest");
  }

  const ts = Number(cursor.slice(0, sepIdx));
  const digest = cursor.slice(sepIdx + 1);
  if (!Number.isFinite(ts) || !digest) {
    throw new Error("Invalid list operations cursor format: invalid timestamp or digest");
  }

  return { digest, timestamp: ts };
}

// `withApiImpl` is a DI seam used by ~30 unit-test call sites in
// `sdk.test.ts` to inject a fake JSON-RPC api without a `jest.spyOn` per
// test. The default points at the real `withApi`, so production callers
// pass through unchanged.
export const getListOperations = async (
  config: SuiCoinConfig,
  addr: string,
  order: "asc" | "desc",
  withApiImpl: typeof withApi = withApi,
  cursor?: string,
): Promise<Page<Op>> => {
  const parsedCursor = parseListOperationsCursor(cursor);

  // GraphQL path: alpaca cursor (`timestamp:digest`) → server-side
  // `before/afterCheckpoint` filter via a digest→checkpoint lookup. Per-tx
  // checkpoint digests come back in the same round-trip (no JSON-RPC-style
  // per-checkpoint fan-out).
  if (isGraphQLEnabled(config)) {
    return withGraphQLApi(config, async api => {
      let cursorCheckpoint: number | null = null;
      if (parsedCursor) {
        cursorCheckpoint = await resolveCheckpointSequenceForDigestGraphQL(
          api,
          parsedCursor.digest,
        );
      }
      // The bound includes the cursor's own checkpoint — see {@link dropOperationsBeforeCursor}. The
      // ±1 achieves that whether the server treats these filters as strict or inclusive; either way
      // the extra checkpoint's items sit on the wrong side of the cursor and the drop below clears
      // them.
      const boundsFrom = (
        seq: number,
        includeCursorCheckpoint: boolean,
      ): { beforeCheckpoint?: number; afterCheckpoint?: number } => {
        if (order === "desc") {
          return { beforeCheckpoint: includeCursorCheckpoint ? seq + 1 : seq };
        }
        if (!includeCursorCheckpoint) return { afterCheckpoint: seq };
        // `afterCheckpoint: 0` would exclude checkpoint 0 itself, so genesis drops the bound.
        return seq === 0 ? {} : { afterCheckpoint: seq - 1 };
      };

      const fetchPage = async (
        filter: { beforeCheckpoint?: number; afterCheckpoint?: number } | undefined,
      ) => {
        const { pairs, hasPreviousPage, hasNextPage } =
          await getTransactionsWithCheckpointDigestsGraphQL(
            api,
            addr,
            TRANSACTIONS_LIMIT_PER_QUERY,
            filter,
            order,
          );
        const sortedPairs = pairs.slice().sort((a, b) => compareOperations(order)(a.tx, b.tx));
        const sorted = sortedPairs.filter(({ tx }) => !isSettlementTransaction(tx));
        return {
          received: pairs.length,
          // The connection walks backwards, so "more to come" is `hasPreviousPage` going desc and
          // `hasNextPage` going asc.
          serverHasMore: order === "desc" ? hasPreviousPage : hasNextPage,
          // Resume point when nothing survives the client-side filters — see the `next` gate below.
          boundary: sortedPairs.at(-1)?.tx,
          sorted,
          afterCursor: dropOperationsBeforeCursor({
            operations: sorted.map(p => p.tx),
            order,
            cursor: parsedCursor,
          }),
        };
      };

      let page = await fetchPage(
        cursorCheckpoint === null ? undefined : boundsFrom(cursorCheckpoint, true),
      );
      // Same stall guard as the gRPC arm.
      if (
        cursorCheckpoint !== null &&
        page.afterCursor.length === 0 &&
        page.received >= TRANSACTIONS_LIMIT_PER_QUERY
      ) {
        page = await fetchPage(boundsFrom(cursorCheckpoint, false));
      }
      const afterCursor = page.afterCursor;
      const digestToHash = new Map(
        page.sorted.map(({ tx, checkpointDigest }) => [tx.digest, checkpointDigest]),
      );
      const items = afterCursor.map(t =>
        transactionToCoinFrameworkOperation(addr, t, digestToHash.get(t.digest)),
      );
      // Same boundary fallback as the gRPC arm: a page whose survivors were all filtered out must
      // still hand back a resume point, or the caller reads the empty cursor as the end of history.
      const last = afterCursor.at(-1) ?? page.boundary;
      // The connection answers "is there more?" directly — see {@link dropOperationsBeforeCursor}
      // for why the surviving count cannot.
      const next =
        page.serverHasMore && last?.timestampMs
          ? serializeListOperationsCursor({
              digest: last.digest,
              timestamp: Number(last.timestampMs),
            })
          : undefined;
      return { items, next };
    });
  }

  if (getTransport(config) === "grpc") {
    return withGrpcApi(config, async api => {
      // The alpaca cursor is `timestamp:digest`; translate its digest to a checkpoint bound in the
      // direction of travel, including the cursor's own checkpoint — see
      // {@link dropOperationsBeforeCursor}. `startCheckpoint` is inclusive, `endCheckpoint` exclusive.
      const cursorCheckpoint = parsedCursor
        ? await resolveCheckpointForDigestGrpc(api, parsedCursor.digest)
        : null;
      const boundsFrom = (seq: number, includeCursorCheckpoint: boolean) =>
        order === "desc"
          ? { endCheckpoint: includeCursorCheckpoint ? seq + 1 : seq }
          : { startCheckpoint: includeCursorCheckpoint ? seq : seq + 1 };

      const fetchPage = async (bounds: { startCheckpoint?: number; endCheckpoint?: number }) => {
        const { transactions, endReason } = await listTransactionsByAddressGrpc(api, {
          address: addr,
          limit: TRANSACTIONS_LIMIT_PER_QUERY,
          order,
          ...bounds,
        });
        const finalized = transactions.filter(isFinalizedGrpcTx).sort(compareOperations(order));
        const sorted = finalized.filter(tx => !isSettlementTransaction(tx));
        return {
          received: transactions.length,
          serverHasMore: grpcPageMayHaveMore(
            endReason,
            transactions.length,
            TRANSACTIONS_LIMIT_PER_QUERY,
          ),
          // Furthest point the server actually reached, before settlement filtering and
          // cursor-dropping. It is the resume point when nothing survives those, so a page made
          // entirely of settlement transactions still advances the walk — see the `next` gate below.
          boundary: finalized.at(-1),
          afterCursor: dropOperationsBeforeCursor({
            operations: sorted,
            order,
            cursor: parsedCursor,
          }),
        };
      };

      let page = await fetchPage(
        cursorCheckpoint === null ? {} : boundsFrom(cursorCheckpoint, true),
      );
      // Stall guard: only reachable at ≥ TRANSACTIONS_LIMIT_PER_QUERY transactions for this address
      // in one checkpoint, and it trades that checkpoint's unseen remainder for pagination that keeps
      // moving. See {@link dropOperationsBeforeCursor}.
      if (
        cursorCheckpoint !== null &&
        page.afterCursor.length === 0 &&
        page.received >= TRANSACTIONS_LIMIT_PER_QUERY
      ) {
        page = await fetchPage(boundsFrom(cursorCheckpoint, false));
      }
      const afterCursor = page.afterCursor;
      // One extra streamed call buys the real `blockHash` the other transports report; anything
      // unresolved keeps the mapper's `synthetic-<sequence>` fallback.
      const checkpointDigests = await fetchCheckpointDigestsGrpc(api, {
        address: addr,
        sequences: afterCursor
          .map(tx => Number(tx.checkpoint))
          .filter(seq => Number.isFinite(seq) && seq > 0),
        limit: TRANSACTIONS_LIMIT_PER_QUERY,
      });
      const items = afterCursor.map(tx =>
        transactionToCoinFrameworkOperation(
          addr,
          tx,
          tx.checkpoint ? checkpointDigests.get(tx.checkpoint) : undefined,
        ),
      );
      // Falling back to the page's own boundary keeps the walk moving when the server has more but
      // nothing survived the client-side filters: without it the cursor collapses to `undefined` and
      // the caller reads that as the end of history. Only a page that returned nothing at all leaves
      // no resume point — the opaque watermark that would cover it does not fit this cursor format.
      const last = afterCursor.at(-1) ?? page.boundary;
      // The stream's own stop reason answers "is there more?" — see {@link grpcPageMayHaveMore}. The
      // surviving count cannot: settlement filtering and cursor-dropping both shrink a page that had
      // more behind it, and a filtered scan can stop on its server-side budget short of the limit.
      const next =
        page.serverHasMore && last?.timestampMs
          ? serializeListOperationsCursor({
              digest: last.digest,
              timestamp: Number(last.timestampMs),
            })
          : undefined;
      return { items, next };
    });
  }

  return withApiImpl(config, async api => {
    const rpcOrder = convertApiOrderToSdkOrder(order);
    const rpcCursor = toSdkCursor(parsedCursor?.digest ?? cursor);

    const [opsOut, opsIn] = await Promise.all([
      queryTransactions({
        api,
        addr,
        type: "OUT",
        cursor: rpcCursor,
        order: rpcOrder,
        options: { showEvents: true },
      }),
      queryTransactions({
        api,
        addr,
        type: "IN",
        cursor: rpcCursor,
        order: rpcOrder,
        options: { showEvents: true },
      }),
    ]);

    // some IN operations are also OUT operations because the sender receive a new version of the coin objects,
    // so IN operations and OUT operations are not disjoint => deduplication is needed before sorting and pagination.
    // SIP-58 settlement transactions (bookkeeping for accumulator state) are excluded.
    const mergedOps = uniqBy([...opsOut.data, ...opsIn.data], tx => tx.digest).filter(
      tx => !isSettlementTransaction(tx),
    );

    // restore order
    const sortedOps = [...mergedOps].sort(compareOperations(order));

    // drop operations before the current page start cursor
    const afterCursorOps = dropOperationsBeforeCursor({
      operations: sortedOps,
      order,
      cursor: parsedCursor,
    });

    // compute next cursor, and drop operations after it
    const { operations: pageOps, nextCursor } = dropOperationsAfterNextCursor({
      order,
      cursor,
      pageOps: afterCursorOps,
      outOps: opsOut,
      inOps: opsIn,
    });

    // fetch checkpoints for the operations
    const uniqueCheckpoints = new Set(
      pageOps.map(t => t.checkpoint).filter((cp): cp is string => Boolean(cp)),
    );
    const checkpointHashMap = new Map<string, string>();
    await Promise.all(
      Array.from(uniqueCheckpoints).map(async checkpoint => {
        try {
          const checkpointData = await api.getCheckpoint({ id: checkpoint });
          checkpointHashMap.set(checkpoint, checkpointData.digest);
        } catch (error) {
          console.warn(
            `Failed to fetch checkpoint ${checkpoint}, will use synthetic hash for associated operations:`,
            error,
          );
        }
      }),
    );

    // convert operations to coin-framework model
    const operations = pageOps.map(t =>
      transactionToCoinFrameworkOperation(
        addr,
        t,
        t.checkpoint ? checkpointHashMap.get(t.checkpoint) : undefined,
      ),
    );

    return {
      items: operations,
      next: nextCursor,
    };
  });
};

/**
 * Subset of `Checkpoint` populated by every transport. Narrowed at the
 * public surface so flipping the flag can't silently null out a wider
 * field — a caller needing more adds the field to every arm of
 * {@link withTransport}, never reaches for one transport's client.
 */
export type MinimalCheckpoint = Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">;

// Sequence numbers are UInt53 — fit in the JS safe-integer range. Base58
// digests (~44 chars) fail `^\d+$` and route to JSON-RPC. The `isSafeInteger`
// check rules out 16-digit numeric strings above 2^53-1 that would silently
// lose precision via `Number(id)`.
const isSequenceNumber = (id: string): boolean => {
  if (id.length === 0 || !/^\d+$/.test(id)) return false;
  const seq = Number(id);
  return Number.isSafeInteger(seq) && seq >= 0;
};

/**
 * Get a checkpoint metadata. JSON-RPC accepts either a sequence number or a digest; GraphQL
 * only accepts a sequence number — digest IDs throw. Returns the narrow {@link MinimalCheckpoint}.
 */
export const getCheckpoint = async (
  config: SuiCoinConfig,
  id: string,
): Promise<MinimalCheckpoint> => {
  if (isGraphQLEnabled(config) && !isSequenceNumber(id)) {
    throw new Error(
      `getCheckpoint(${id}): digest-based lookups are not supported on the GraphQL transport. ` +
        "Pass a sequence number, or route this caller through the JSON-RPC endpoint.",
    );
  }
  return withTransport(config, {
    jsonRpc: async api => {
      const cp = await api.getCheckpoint({ id });
      return {
        digest: cp.digest,
        sequenceNumber: cp.sequenceNumber,
        timestampMs: cp.timestampMs,
      };
    },
    graphql: api => getCheckpointGraphQL(api, id),
    // Project down explicitly: `getCheckpointGrpc` also carries `previousDigest` for
    // `toBlockInfo`, and `MinimalCheckpoint` is a narrowed contract the other arms honour.
    grpc: async api => {
      const { digest, sequenceNumber, timestampMs } = await getCheckpointGrpc(api, id);
      return { digest, sequenceNumber, timestampMs };
    },
  });
};

/** Checkpoint metadata only; see {@link getBlock} for the variant that includes the transactions. */
export const getBlockInfo = async (config: SuiCoinConfig, id: string): Promise<BlockInfo> => {
  const fromJsonRpc = async (api: SuiJsonRpcClient): Promise<BlockInfo> => {
    const checkpoint = await api.getCheckpoint({ id });
    return toBlockInfo(checkpoint);
  };
  // GraphQL `checkpoint(...)` only accepts UInt53 sequence numbers, so digest lookups fall
  // back to JSON-RPC there. gRPC's `GetCheckpoint` takes either, so it needs no fallback.
  if (!isSequenceNumber(id) && getTransport(config) === "graphql") {
    return withApi(config, fromJsonRpc);
  }
  return withTransport(config, {
    jsonRpc: fromJsonRpc,
    graphql: async api => {
      const cp = await getBlockInfoFieldsGraphQL(api, Number(id));
      if (!cp) throw new Error(`GraphQL Checkpoint not found: ${id}`);
      return toBlockInfo(cp);
    },
    grpc: async api => toBlockInfo(await getCheckpointGrpc(api, id)),
  });
};

/** Checkpoint metadata + all transactions in the block; see {@link getBlockInfo} for the metadata-only variant. */
export const getBlock = async (config: SuiCoinConfig, id: string): Promise<Block> => {
  const fromJsonRpc = async (api: SuiJsonRpcClient): Promise<Block> => {
    const checkpoint = await api.getCheckpoint({ id });
    const rawTxs = await queryTransactionsByDigest({
      api,
      digests: checkpoint.transactions,
    });
    return {
      info: toBlockInfo(checkpoint),
      transactions: rawTxs.filter(tx => !isSettlementTransaction(tx)).map(toBlockTransaction),
    };
  };
  // GraphQL `checkpoint(...)` only accepts UInt53 sequence numbers, so digest lookups fall
  // back to JSON-RPC there. gRPC's `GetCheckpoint` takes either, so it needs no fallback.
  if (!isSequenceNumber(id) && getTransport(config) === "graphql") {
    return withApi(config, fromJsonRpc);
  }
  return withTransport(config, {
    jsonRpc: fromJsonRpc,
    graphql: async api => {
      const block = await getBlockGraphQL(api, Number(id));
      if (!block) throw new Error(`GraphQL Block not found: ${id}`);
      return {
        info: toBlockInfo(block.info),
        transactions: block.transactions
          .filter(tx => !isSettlementTransaction(tx))
          .map(toBlockTransaction),
      };
    },
    grpc: async api => {
      const block = await getBlockGrpc(api, id);
      return {
        info: toBlockInfo(block.info),
        transactions: block.transactions
          .filter(tx => !isSettlementTransaction(tx))
          .map(toBlockTransaction),
      };
    },
  });
};

const getTotalGasUsed = (effects?: TransactionEffects | null): bigint => {
  const gasSummary = effects?.gasUsed;
  if (!gasSummary) return BigInt(0);
  return (
    BigInt(gasSummary.computationCost) +
    BigInt(gasSummary.storageCost) -
    BigInt(gasSummary.storageRebate)
  );
};

/**
 * Get coins for a given address and coin type, stopping when we have enough to cover the amount.
 * Returns the minimum coins needed to cover the required amount.
 *
 * Post SIP-58 the RPC `suix_getCoins` returns "fake coin" objects that represent
 * the address-level balance. These synthetic coins are indistinguishable from
 * real coin objects at the API level (`CoinStruct` shape) and can be used in
 * `mergeCoins` / `splitCoins` just like real ones. The transaction builder
 * transparently converts them into `FundsWithdrawal` operations.
 */
export const getCoinsForAmount = async (
  client: ClientWithCoreApi,
  address: string,
  coinType: string,
  requiredAmount: bigint,
) => {
  const coins: {
    coinObjectId: string;
    version: string;
    digest: string;
    balance: string;
  }[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let totalBalance = 0n;

  // `client.core.listCoins` is shared between JSON-RPC and the synthetic
  // GraphQL adapter; the SDK normalizes both to the same `Coin[]` shape.
  while (hasNextPage && totalBalance < requiredAmount) {
    const response = await client.core.listCoins({
      owner: address,
      coinType,
      cursor,
    });

    const validCoins = response.objects
      .filter(coin => BigInt(coin.balance) > 0n)
      .sort((a, b) => {
        const diff = BigInt(b.balance) - BigInt(a.balance);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });

    let currentBalance = totalBalance;
    let i = 0;
    while (i < validCoins.length && currentBalance < requiredAmount) {
      const coin = validCoins[i];
      coins.push({
        coinObjectId: coin.objectId,
        version: coin.version,
        digest: coin.digest,
        balance: coin.balance,
      });
      currentBalance += BigInt(coin.balance);
      i++;
    }
    totalBalance = currentBalance;

    cursor = response.cursor;
    hasNextPage = response.hasNextPage && totalBalance < requiredAmount;
  }

  return coins;
};

type SuiFundingModel = {
  /** SIP-58 address-balance portion of the SUI balance. */
  addressBalance: bigint;
  /** Real SUI coin objects (the SDK's `coinBalance` = total − address balance). */
  realCoinBalance: bigint;
  /**
   * Source gas from the address balance via `setGasPayment([])`. Only when there
   * are no real coin objects — otherwise let the SDK auto-select a real coin for
   * gas so the *entire* address balance stays available for the transfer.
   */
  gasFromAddressBalance: boolean;
  /**
   * Split the transfer straight out of `tx.gas`. Only for the classic
   * coin-object-only account (no address balance); when an address balance
   * exists the transfer is resolved via `coinWithBalance` instead.
   */
  transferFromGasCoin: boolean;
};

/**
 * Decide how a send funds its gas vs. its transfer (`getCoins` is unusable post-SIP-58 — it
 * returns synthetic "fake coins" for the address balance, so we read `client.core.getBalance`).
 *
 * Gas comes from real coin objects whenever any exist, keeping the full address balance free for
 * the transfer — forcing `setGasPayment([])` while the transfer also drains the address balance is
 * what overdrew it (`amount + gasBudget > addressBalance`) and failed at broadcast. Only with no
 * real coins do we fall back to address-balance gas (then `total === addressBalance`, so the
 * existing `amount + gasBudget ≤ total` check already prevents an overdraw).
 */
async function getSuiFundingModel(
  client: ClientWithCoreApi,
  address: string,
): Promise<SuiFundingModel> {
  const { balance } = await client.core.getBalance({
    owner: address,
    coinType: DEFAULT_COIN_TYPE,
  });
  const addressBalance = BigInt(balance.addressBalance);
  const realCoinBalance = BigInt(balance.coinBalance);
  return {
    addressBalance,
    realCoinBalance,
    gasFromAddressBalance: realCoinBalance === 0n,
    transferFromGasCoin: addressBalance === 0n && realCoinBalance > 0n,
  };
}

/**
 * Creates a Sui transaction block for transferring coins.
 *
 * @param address - The sender's address
 * @param transaction - The transaction details including recipient, amount, and coin type
 * @param withObjects - Return serialized input objects used in the transaction
 * @param resolution - For token clear signing
 * @returns Promise<TransactionBlock> - A built transaction block ready for execution
 *
 */
export const createTransaction = async (
  config: SuiCoinConfig,
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean = false,
  resolution?: Resolution,
): Promise<CoreTransaction> => {
  const { serialized, bcsObjects } = await createTransactionFromMode(
    config,
    address,
    transaction,
    withObjects,
  );

  return {
    unsigned: serialized,
    ...(withObjects ? { objects: bcsObjects } : {}),
    ...(transaction.coinType !== DEFAULT_COIN_TYPE && resolution ? { resolution } : {}),
  };
};

const createTransactionFromMode = (
  config: SuiCoinConfig,
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
) => {
  const { mode } = transaction;
  switch (mode) {
    case "delegate":
      return createTransactionForDelegate(config, address, transaction, withObjects);
    case "undelegate":
      return createTransactionForUndelegate(config, address, transaction, withObjects);
    default:
      return createTransactionForOthers(config, address, transaction, withObjects);
  }
};

/**
 * Shared post-processing for the three transaction builders: build BCS via
 * `Transaction.build({ client })` and optionally collect input-object BCS for
 * clear-signing. Every transport flows through this — JSON-RPC passes a
 * `SuiJsonRpcClient`, gRPC a `SuiGrpcClient`, and GraphQL the synthetic
 * `ClientWithCoreApi` from `makeSuiClientFromGraphQL`.
 */
async function finalizeBuild(
  tx: Transaction,
  client: ClientWithCoreApi,
  withObjects: boolean,
): Promise<{ serialized: Uint8Array; bcsObjects: Uint8Array[] }> {
  const serialized = await tx.build({ client });
  const bcsObjects = withObjects ? (await getInputObjects(tx, client)).bcsObjects : [];
  return { serialized, bcsObjects };
}

/**
 * SIP-58: when no coin objects exist, `setGasPayment([])` tells the network
 * to source gas from the address balance via FundsWithdrawal.
 */
const buildDelegateBody = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  client: ClientWithCoreApi,
) => {
  const tx = new Transaction();
  const sender = ensureAddressFormat(address);
  tx.setSender(sender);

  const { gasFromAddressBalance, transferFromGasCoin } = await getSuiFundingModel(client, sender);
  if (gasFromAddressBalance) {
    tx.setGasPayment([]);
  }

  const { amount } = transaction;
  // When the stake is funded from the SIP-58 address balance, `tx.gas` is sized
  // only for the gas budget, so we can't split the stake amount out of it.
  // Resolve it via `coinWithBalance`, which the SDK turns into a FundsWithdrawal
  // sized for the stake amount. Only split from `tx.gas` for coin-object-only accounts.
  const stakeCoin = transferFromGasCoin
    ? tx.splitCoins(tx.gas, [BigInt(amount.toFixed())])[0]
    : coinWithBalance({ balance: BigInt(amount.toFixed()) })(tx);

  tx.moveCall({
    target: "0x3::sui_system::request_add_stake",
    arguments: [
      tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
      stakeCoin,
      tx.pure.address(transaction.recipient),
    ],
  });

  tx.setGasBudgetIfNotSet(ONE_SUI / 10);
  return finalizeBuild(tx, client, withObjects);
};

const createTransactionForDelegate = (
  config: SuiCoinConfig,
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
) =>
  withTransport(config, {
    jsonRpc: api => buildDelegateBody(address, transaction, withObjects, api),
    graphql: api =>
      buildDelegateBody(address, transaction, withObjects, makeSuiClientFromGraphQL(api)),
    // `SuiGrpcClient` is a `ClientWithCoreApi`, so the build path takes it directly — no adapter.
    grpc: api => buildDelegateBody(address, transaction, withObjects, api),
  });

const buildUndelegateBody = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  client: ClientWithCoreApi,
) => {
  const tx = new Transaction();
  const sender = ensureAddressFormat(address);
  tx.setSender(sender);

  if ((await getSuiFundingModel(client, sender)).gasFromAddressBalance) {
    tx.setGasPayment([]);
  }

  const { useAllAmount, amount } = transaction;

  if (useAllAmount) {
    tx.moveCall({
      target: "0x3::sui_system::request_withdraw_stake",
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), tx.object(transaction.stakedSuiId!)],
    });
  } else {
    const res = tx.moveCall({
      target: "0x3::staking_pool::split",
      arguments: [tx.object(transaction.stakedSuiId!), tx.pure.u64(amount.toString())],
    });
    tx.moveCall({
      target: "0x3::sui_system::request_withdraw_stake",
      arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), res],
    });
  }

  tx.setGasBudgetIfNotSet(ONE_SUI / 10);
  return finalizeBuild(tx, client, withObjects);
};

const createTransactionForUndelegate = (
  config: SuiCoinConfig,
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
) =>
  withTransport(config, {
    jsonRpc: api => buildUndelegateBody(address, transaction, withObjects, api),
    graphql: api =>
      buildUndelegateBody(address, transaction, withObjects, makeSuiClientFromGraphQL(api)),
    // `SuiGrpcClient` is a `ClientWithCoreApi`, so the build path takes it directly — no adapter.
    grpc: api => buildUndelegateBody(address, transaction, withObjects, api),
  });

/**
 * SIP-58 transfer builder:
 *
 * - **Native SUI**: when the account has only coin objects (no address balance), splits the
 *   transfer out of `tx.gas`. When an address balance exists, resolves the transfer via
 *   `coinWithBalance` (FundsWithdrawal from the address balance) while gas is paid from real
 *   coin objects — see {@link getSuiFundingModel}.
 *
 * - **Non-SUI tokens**: first tries `getCoinsForAmount` (which may return fake
 *   coins).  If no coin objects are available at all, falls back to
 *   `coinWithBalance` which resolves the funds from the address balance
 *   automatically (including FundsWithdrawal).
 */
const buildOthersBody = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  client: ClientWithCoreApi,
) => {
  const tx = new Transaction();
  const sender = ensureAddressFormat(address);
  tx.setSender(sender);

  const { gasFromAddressBalance, transferFromGasCoin } = await getSuiFundingModel(client, sender);
  if (gasFromAddressBalance) {
    tx.setGasPayment([]);
  }

  if (transaction.coinType !== DEFAULT_COIN_TYPE) {
    const requiredAmount = BigInt(transaction.amount.toFixed());
    const coins = await getCoinsForAmount(client, sender, transaction.coinType, requiredAmount);
    const collectedBalance = coins.reduce((sum, c) => sum + BigInt(c.balance), 0n);

    if (coins.length > 0 && collectedBalance >= requiredAmount) {
      const coinObjects = coins.map(coin => tx.object(coin.coinObjectId));

      if (coinObjects.length > 1) {
        tx.mergeCoins(coinObjects[0], coinObjects.slice(1));
      }

      const [coin] = tx.splitCoins(coinObjects[0], [BigInt(transaction.amount.toFixed())]);
      tx.transferObjects([coin], transaction.recipient);
    } else {
      const coin = coinWithBalance({
        type: transaction.coinType,
        balance: BigInt(transaction.amount.toFixed()),
      })(tx);
      tx.transferObjects([coin], transaction.recipient);
    }
  } else if (transferFromGasCoin) {
    const [coin] = tx.splitCoins(tx.gas, [BigInt(transaction.amount.toFixed())]);
    tx.transferObjects([coin], transaction.recipient);
  } else {
    // SIP-58 native SUI path: the transfer is drawn from the address balance via
    // `coinWithBalance` (a FundsWithdrawal sized for the transfer amount). Gas is paid from
    // real coin objects when present (see `getSuiFundingModel`), so the transfer can consume
    // the full address balance without the gas reservation overdrawing it.
    const coin = coinWithBalance({
      balance: BigInt(transaction.amount.toFixed()),
    })(tx);
    tx.transferObjects([coin], transaction.recipient);
  }

  return finalizeBuild(tx, client, withObjects);
};

const createTransactionForOthers = (
  config: SuiCoinConfig,
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
) =>
  withTransport(config, {
    jsonRpc: api => buildOthersBody(address, transaction, withObjects, api),
    graphql: api =>
      buildOthersBody(address, transaction, withObjects, makeSuiClientFromGraphQL(api)),
    // `SuiGrpcClient` is a `ClientWithCoreApi`, so the build path takes it directly — no adapter.
    grpc: api => buildOthersBody(address, transaction, withObjects, api),
  });

/**
 * Performs a dry run of a transaction to estimate gas costs and fees.
 *
 * Post SIP-58: when the sender has no SUI coin objects (only address-level
 * balance), `createTransaction` sets `gasPayment` to `[]`, signalling the
 * network to source gas via `FundsWithdrawal`.  The dry-run endpoint handles
 * this transparently, so fee estimation works for both coin-object and
 * address-balance funding models.
 */
export const paymentInfo = async (
  config: SuiCoinConfig,
  sender: string,
  fakeTransaction: TransactionType,
) => {
  const { unsigned: txb } = await createTransaction(config, sender, fakeTransaction, false);
  return withTransport(config, {
    jsonRpc: async api => {
      try {
        const dryRunTxResponse = await api.dryRunTransactionBlock({
          transactionBlock: txb,
        });
        const fees = getTotalGasUsed(dryRunTxResponse.effects);
        return {
          gasBudget: dryRunTxResponse.input.gasData.budget,
          totalGasUsed: fees,
          fees,
        };
      } catch (error) {
        throw mapDryRunError(error);
      }
    },
    graphql: async api => {
      try {
        const sim = await simulateTransactionGraphQL(api, txb);
        const fees =
          BigInt(sim.computationCost) + BigInt(sim.storageCost) - BigInt(sim.storageRebate);
        return { gasBudget: sim.gasBudget, totalGasUsed: fees, fees };
      } catch (error) {
        throw mapDryRunError(error);
      }
    },
    grpc: async api => {
      try {
        const sim = await simulateTransactionGrpc(api, txb);
        const fees =
          BigInt(sim.computationCost) + BigInt(sim.storageCost) - BigInt(sim.storageRebate);
        return { gasBudget: sim.gasBudget, totalGasUsed: fees, fees };
      } catch (error) {
        throw mapDryRunError(error);
      }
    },
  });
};

/**
 * Narrow public shape: `digest` + `effects.status`. GraphQL's
 * `executeTransaction` mutation returns only this subset; the JSON-RPC SDK
 * returns much more but no current consumer reads the rest. Anyone needing
 * post-finality state (events, balanceChanges, gasUsed) should poll
 * `transaction(digest:)` after broadcast.
 */
export type ExecuteTransactionBlockResult = {
  digest: string;
  effects: { status: { status: "success" | "failure"; error?: string } };
};

const toExecuteResult = (
  digest: string,
  status: "success" | "failure",
  error?: string,
): ExecuteTransactionBlockResult => ({
  digest,
  effects: { status: { status, ...(error ? { error } : {}) } },
});

export const executeTransactionBlock = async (
  config: SuiCoinConfig,
  params: ExecuteTransactionBlockParams,
): Promise<ExecuteTransactionBlockResult> =>
  withTransport(config, {
    jsonRpc: async api => {
      const r = await api.executeTransactionBlock(params);
      // `effects` requires `options.showEffects: true` upstream — `broadcast.ts`
      // always sets it. A null/missing payload here means the proxy stripped
      // it; surface that as a distinct error rather than masquerading as a
      // genuine on-chain failure.
      if (!r.effects?.status) {
        return toExecuteResult(r.digest, "failure", "missing effects in broadcast response");
      }
      const s = r.effects.status;
      return toExecuteResult(r.digest, s.status, s.error);
    },
    graphql: async api => {
      const signatures = Array.isArray(params.signature) ? params.signature : [params.signature];
      const r = await executeTransactionGraphQL(api, params.transactionBlock, signatures);
      if (r.status === null) {
        return toExecuteResult(r.digest, "failure", "missing effects in broadcast response");
      }
      const status = r.status === "SUCCESS" ? "success" : "failure";
      return toExecuteResult(r.digest, status, status === "failure" ? r.error : undefined);
    },
    grpc: async api => {
      const signatures = Array.isArray(params.signature) ? params.signature : [params.signature];
      const r = await executeTransactionGrpc(api, params.transactionBlock, signatures);
      if (!r.status) {
        return toExecuteResult(r.digest, "failure", "missing effects in broadcast response");
      }
      return toExecuteResult(r.digest, r.status, r.error);
    },
  });

type LoadOperationResponse = {
  operations: SuiTransactionBlockResponse[];
  cursor?: QueryTransactionBlocksParams["cursor"];
};

/**
 * Fetch operations for a specific address and type until the limit is reached
 */
export const loadOperations = async ({
  cursor,
  operations,
  order,
  ...params
}: {
  api: SuiJsonRpcClient;
  addr: string;
  type: OperationType;
  operations: PaginatedTransactionResponse["data"];
  order: "ascending" | "descending";
  cursor?: QueryTransactionBlocksParams["cursor"];
}): Promise<LoadOperationResponse> => {
  try {
    if (operations.length >= TRANSACTIONS_LIMIT) {
      return { operations, cursor };
    }

    const { data, nextCursor, hasNextPage } = await queryTransactions({
      ...params,
      order,
      cursor,
    });

    operations.push(...data);
    if (!hasNextPage) {
      return { operations: operations, cursor: nextCursor };
    }

    await loadOperations({ ...params, cursor: nextCursor, operations, order });
  } catch (error: any) {
    if (error.type === "InvalidParams") {
      log("coin:sui", "(network/sdk): loadOperations failed with cursor, retrying without it", {
        error,
        params,
      });
    } else {
      log("coin:sui", "(network/sdk): loadOperations error", { error, params });
    }
  }

  return { operations: operations, cursor: cursor };
};

/**
 * Query transactions for given address from RPC
 */
export const queryTransactions = async (params: {
  api: SuiJsonRpcClient;
  addr: string;
  type: OperationType;
  order: "ascending" | "descending";
  cursor?: QueryTransactionBlocksParams["cursor"];
  options?: Pick<SuiTransactionBlockResponseOptions, "showEvents">;
}): Promise<PaginatedTransactionResponse> => {
  const { api, addr, type, cursor, order, options = {} } = params;
  // what we really want is a FromOrToAddress filter, but it's not supported yet
  // it would relieve a lot of complexity in the merged/sorted pagination and cursor boundary filtering logic above
  const filter: QueryTransactionBlocksParams["filter"] =
    type === "IN" ? { ToAddress: addr } : { FromAddress: addr };

  return await api.queryTransactionBlocks({
    filter,
    cursor,
    order,
    options: { ...TRANSACTIONS_QUERY_OPTIONS, ...options },
    limit: TRANSACTIONS_LIMIT_PER_QUERY,
  });
};

/**
 * Query transactions by digest from the RPC.
 *
 * Note that transaction limit per query applies (usually {@link TRANSACTIONS_LIMIT_PER_QUERY}, but can vary
 * depending on the RPC settings).
 */
export const queryTransactionsByDigest = async (params: {
  api: SuiJsonRpcClient;
  digests: string[];
  options?: Pick<SuiTransactionBlockResponseOptions, "showEvents">;
}): Promise<SuiTransactionBlockResponse[]> => {
  const { api, digests, options = {} } = params;
  const chunkSize = TRANSACTIONS_LIMIT_PER_QUERY;
  const responses: SuiTransactionBlockResponse[] = [];

  for (let i = 0; i < digests.length; i += chunkSize) {
    const chunk = await api.multiGetTransactionBlocks({
      digests: digests.slice(i, i + chunkSize),
      options: { ...TRANSACTIONS_QUERY_OPTIONS, ...options },
    });
    responses.push(...chunk);
  }

  return responses;
};

export const toStakes = (address: string, delegation: DelegatedStake): Stake[] =>
  delegation.stakes.map(stake => {
    const { deposited, rewarded } = toStakeAmounts(stake);
    return {
      uid: stake.stakedSuiId,
      address: address,
      delegate: delegation.validatorAddress,
      state: toStakeState(stake.status),
      asset: { type: "native" },
      amount: deposited + rewarded,
      amountDeposited: deposited,
      amountRewarded: rewarded,
      actions: [],
      details: {
        activeEpoch: Number(stake.stakeActiveEpoch),
        requestEpoch: Number(stake.stakeRequestEpoch),
      },
    };
  });

export const toStakeState = (status: "Pending" | "Active" | "Unstaked"): StakeState => {
  switch (status) {
    case "Pending":
      return "activating";
    case "Active":
      return "active";
    case "Unstaked":
      return "inactive";
  }
};

export const toStakeAmounts = (stake: StakeObject): { deposited: bigint; rewarded: bigint } => {
  switch (stake.status) {
    case "Pending":
      return { deposited: BigInt(stake.principal), rewarded: 0n };
    case "Active":
      return {
        deposited: BigInt(stake.principal),
        rewarded: BigInt(stake.estimatedReward),
      };
    case "Unstaked":
      return { deposited: BigInt(stake.principal), rewarded: 0n }; // note: we lose reward information in unstaked state here
  }
};

/**
 * Active validator set with APY. JSON-RPC: two parallel calls merged by
 * `suiAddress`. GraphQL and gRPC have no server-side APY, so both derive it
 * client-side from pool exchange rates — see {@link getValidatorsGraphQL} and
 * {@link getValidatorsGrpc}.
 */
export const getValidators = (config: SuiCoinConfig): Promise<SuiValidator[]> =>
  withTransport(config, {
    jsonRpc: async api => {
      const [{ activeValidators }, { apys }] = await Promise.all([
        api.getLatestSuiSystemState(),
        api.getValidatorsApy(),
      ]);
      const hash = Object.fromEntries(apys.map(({ address, apy }) => [address, apy]));
      // `getValidatorsApy` and `getLatestSuiSystemState` are independent calls;
      // a missing APY entry (race, partial response) defaults to 0 to honour
      // the `SuiValidator.apy: number` contract. Matches the GraphQL branch.
      return activeValidators.map(item => ({
        ...item,
        apy: hash[item.suiAddress] ?? 0,
      }));
    },
    graphql: getValidatorsGraphQL,
    grpc: getValidatorsGrpc,
  });
