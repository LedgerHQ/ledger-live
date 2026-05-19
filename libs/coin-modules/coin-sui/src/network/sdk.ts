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
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";
import uniqBy from "lodash/unionBy";
import coinConfig from "../config";
import { BLOCK_HEIGHT, ONE_SUI } from "../constants";
import type {
  CoreTransaction,
  CreateExtrinsicArg,
  Resolution,
  SuiValidator,
  Transaction as TransactionType,
} from "../types";
import { ensureAddressFormat, normalizeSuiAddressForComparison } from "../utils";
import { fetcher, inferNetworkFromUrl } from "./fetcher";
import { getCurrentSuiPreloadData } from "./preload-data";
import { mapDryRunError } from "../logic/mapDryRunError";
import {
  type AsyncGraphQLApiFunction,
  getAllBalancesCachedGraphQL,
  getCheckpointGraphQL,
  getLastBlockGraphQL,
  getDelegatedStakesGraphQL,
  withGraphQLApi,
} from "./sdk.graphql";

type AsyncApiFunction<T> = (api: SuiJsonRpcClient) => Promise<T>;

/** Read-side feature flag; transaction execution always stays on JSON-RPC. */
export function isGraphQLEnabled(currencyId?: string): boolean {
  return coinConfig.getCoinConfig(currencyId).features?.graphql === true;
}

export const TRANSACTIONS_LIMIT_PER_QUERY = 50;
export const TRANSACTIONS_LIMIT = 300;
const MULTI_GET_OBJECTS_LIMIT = 50;

export const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

const STAKING_REQUEST_EVENT = "0x3::staking_pool::StakingRequestEvent";
const UNSTAKING_REQUEST_EVENT = "0x3::validator::UnstakingRequestEvent";

/** Default options for querying transactions. */
const TRANSACTIONS_QUERY_OPTIONS: SuiTransactionBlockResponseOptions = {
  showInput: true,
  showBalanceChanges: true,
  showEffects: true, // To get transaction status and gas fee details
};

/** Fresh JSON-RPC client per call — SuiJsonRpcClient is stateless. */
export async function withApi<T>(execute: AsyncApiFunction<T>, currencyId?: string) {
  const url = coinConfig.getCoinConfig(currencyId).node.url;
  const network = inferNetworkFromUrl(url);
  const transport = new JsonRpcHTTPTransport({
    url,
    fetch: fetcher,
  });

  const api = new SuiJsonRpcClient({ transport, network });
  return execute(api);
}

/** Dispatcher gated on `features.graphql`. No silent fallback — flip the flag to revert. */
export function withTransport<T>(
  currencyId: string | undefined,
  impls: {
    jsonRpc: AsyncApiFunction<T>;
    graphql: AsyncGraphQLApiFunction<T>;
  },
): Promise<T> {
  return isGraphQLEnabled(currencyId)
    ? withGraphQLApi(impls.graphql, currencyId)
    : withApi(impls.jsonRpc, currencyId);
}

/**
 * Wraps a SuiJsonRpcClient to batch multiGetObjects calls in chunks of 50,
 * working around the SUI RPC limit.
 */
export function withBatchedMultiGetObjects(client: SuiJsonRpcClient): SuiJsonRpcClient {
  return new Proxy(client, {
    get(target, prop, _receiver) {
      if (prop === "multiGetObjects") {
        return async (params: Parameters<SuiJsonRpcClient["multiGetObjects"]>[0]) => {
          const { ids } = params;
          if (ids.length <= MULTI_GET_OBJECTS_LIMIT) {
            return target.multiGetObjects(params);
          }
          const results = [];
          for (let i = 0; i < ids.length; i += MULTI_GET_OBJECTS_LIMIT) {
            const chunk = await target.multiGetObjects({
              ...params,
              ids: ids.slice(i, i + MULTI_GET_OBJECTS_LIMIT),
            });
            results.push(...chunk);
          }
          return results;
        };
      }
      const value = Reflect.get(target, prop, target);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    },
  });
}

/**
 * Subset both transports populate. Narrows the dispatcher's surface so the
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
  async (owner: string, currencyId?: string): Promise<DispatchedCoinBalance[]> => {
    // Pick<> is compile-time only — explicitly project both transports' results
    // so the cache never stores transport-specific fields (`coinObjectCount`,
    // `lockedBalance` from JSON-RPC; GraphQL's neutral fillers for the same).
    const balances = await withTransport(currencyId, {
      jsonRpc: api => api.getAllBalances({ owner }),
      graphql: api => getAllBalancesCachedGraphQL(api, owner),
    });
    return balances.map(toDispatchedCoinBalance);
  },
  // Key includes the transport so flipping the flag mid-rollout doesn't
  // cross-pollinate cached entries between JSON-RPC and GraphQL.
  // Inputs are colon-free (owner = `0x` + hex; currencyId is wallet-set).
  (owner: string, currencyId?: string) =>
    `${currencyId ?? "sui"}:${isGraphQLEnabled(currencyId) ? "g" : "j"}:${owner}`,
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
      input.objectId === ACCUMULATOR_ROOT_OBJECT_ID,
  );
}

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

    const coinType = stripBalanceWrapper(evt.ty);
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
  addr: string,
  currencyId?: string,
): Promise<AccountBalance[]> => {
  const balances = await getAllBalancesCached(addr, currencyId);
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

export const getOperationExtra = (
  digest: string,
  currencyId?: string,
): Promise<Record<string, string>> =>
  withApi(async api => {
    const response = await api.getTransactionBlock({
      digest,
      options: {
        showInput: true,
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
      },
    });
    const tx = response.transaction?.data?.transaction;
    if (isStaking(tx)) {
      const inputs = tx.inputs;
      const pure = inputs.filter(x => x.type === "pure") as { valueType: string; value: string }[];
      const amount = pure.find(x => x.valueType === "u64")?.value as string;
      const address = pure.find(x => x.valueType === "address")?.value as string;
      const name = getCurrentSuiPreloadData().validators.find(x => x.suiAddress === address)?.name;
      return { amount, address, name: name || "" };
    }

    if (isUnstaking(response.transaction?.data?.transaction)) {
      const { principal_amount: amount, validator_address: address } = response.events?.find(
        e => e.type === UNSTAKING_REQUEST_EVENT,
      )?.parsedJson as Record<string, string>;
      const name = getCurrentSuiPreloadData().validators.find(x => x.suiAddress === address)?.name;

      return { amount, address, name: name || "" };
    }

    return {};
  }, currencyId);

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
 * `DelegatedStake[]` regardless of transport. GraphQL reconstructs from
 * `StakedSui` objects + system-state (one extra dynamicField per Active
 * stake, deduped); rate failures degrade `estimatedReward` to `"0"`.
 */
export const getDelegatedStakes = (
  owner: string,
  currencyId?: string,
): Promise<DelegatedStake[]> =>
  withTransport(currencyId, {
    jsonRpc: api => api.getStakes({ owner }),
    graphql: api => getDelegatedStakesGraphQL(api, owner),
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

  return {
    id: encodeOperationId(accountId, hash, type),
    accountId,
    // warning this is false:
    blockHash: hash,
    blockHeight: BLOCK_HEIGHT,
    date: getOperationDate(transaction),
    extra: {
      coinType,
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

// This function is only used by alpaca code path
// Logic is similar to getOperationAmount, but we guarantee to return a positive amount in any case
// If there is need to display negative amount for staking or unstaking, the view can handle it based on the type of the operation
export const alpacaGetOperationAmount = (
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
 * Extract staking/unstaking event details from transaction events.
 * For DELEGATE: extracts validatorAddress, stakedObjectId from StakingRequestEvent
 * For UNDELEGATE: extracts validatorAddress, rewardAmount, withdrawnAmount (from principal_amount) from UnstakingRequestEvent
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
 * This function is only used by alpaca code path
 *
 * @returns the operation converted. Note that if param `transaction` was retrieved as an "IN" operations, the type may be converted to "OUT".
 *    It happens for most "OUT" operations because the sender receive a new version of the coin objects.
 */
export function alpacaTransactionToOp(
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
    value: BigInt(alpacaGetOperationAmount(address, transaction, coinType).toString()),
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
 * Convert a SUI RPC checkpoint info to a {@link BlockInfo}.
 *
 * @param checkpoint SUI RPC checkpoint info
 */
export function toBlockInfo(checkpoint: Checkpoint): BlockInfo {
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
  currencyId?: string,
): Promise<{ digest: string; sequenceNumber: string; timestampMs: string }> =>
  withTransport(currencyId, {
    jsonRpc: async api => {
      const checkpoint = await api.getLatestCheckpointSequenceNumber();
      const { digest, sequenceNumber, timestampMs } = await api.getCheckpoint({ id: checkpoint });
      return { digest, sequenceNumber, timestampMs };
    },
    graphql: getLastBlockGraphQL,
  });

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  cursor?: QueryTransactionBlocksParams["cursor"],
  order?: "asc" | "desc",
  currencyId?: string,
): Promise<Operation[]> =>
  withApi(async api => {
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
  }, currencyId);

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

export const getListOperations = async (
  addr: string,
  order: "asc" | "desc",
  withApiImpl: typeof withApi = withApi,
  cursor?: string,
  currencyId?: string,
): Promise<Page<Op>> =>
  withApiImpl(async api => {
    const rpcOrder = convertApiOrderToSdkOrder(order);
    const parsedCursor = parseListOperationsCursor(cursor);
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

    // convert operations to alpaca model
    const operations = pageOps.map(t =>
      alpacaTransactionToOp(
        addr,
        t,
        t.checkpoint ? checkpointHashMap.get(t.checkpoint) : undefined,
      ),
    );

    return {
      items: operations,
      next: nextCursor,
    };
  }, currencyId);

/**
 * Subset of `Checkpoint` populated by both transports. Narrowed at the
 * public surface so flipping the flag can't silently null out a wider
 * field — callers needing more should route through {@link withApi}.
 */
export type MinimalCheckpoint = Pick<Checkpoint, "digest" | "sequenceNumber" | "timestampMs">;

/**
 * Get a checkpoint (a.k.a, a block) metadata. JSON-RPC accepts either a
 * sequence number or a digest; GraphQL only accepts a sequence number
 * — digest IDs throw. Returns the narrow {@link MinimalCheckpoint}.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 */
export const getCheckpoint = async (
  id: string,
  currencyId?: string,
): Promise<MinimalCheckpoint> => {
  // Digest guard for GraphQL: sequence numbers are UInt53 — fit in the JS
  // safe-integer range. Base58 digests (~44 chars) fail `^\d+$` and route to
  // JSON-RPC. The `isSafeInteger` check rules out 16-digit numeric strings
  // above 2^53-1 that would silently lose precision via `Number(id)`.
  const seqCandidate = Number(id);
  const isSequenceNumber =
    id.length > 0 &&
    /^\d+$/.test(id) &&
    Number.isSafeInteger(seqCandidate) &&
    seqCandidate >= 0;
  if (isGraphQLEnabled(currencyId) && !isSequenceNumber) {
    throw new Error(
      `getCheckpoint(${id}): digest-based lookups are not supported on the GraphQL transport. ` +
        "Pass a sequence number, or route this caller through the JSON-RPC endpoint.",
    );
  }
  return withTransport(currencyId, {
    jsonRpc: async api => {
      const cp = await api.getCheckpoint({ id });
      return {
        digest: cp.digest,
        sequenceNumber: cp.sequenceNumber,
        timestampMs: cp.timestampMs,
      };
    },
    graphql: api => getCheckpointGraphQL(api, id),
  });
};

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 * @see {@link getBlock}
 */
export const getBlockInfo = async (id: string, currencyId?: string): Promise<BlockInfo> =>
  withApi(async api => {
    const checkpoint = await api.getCheckpoint({ id });
    return toBlockInfo(checkpoint);
  }, currencyId);

/**
 * Get a checkpoint (a.k.a, a block) metadata with all transactions.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 * @see {@link getBlockInfo}
 */
export const getBlock = async (id: string, currencyId?: string): Promise<Block> =>
  withApi(async api => {
    const checkpoint = await api.getCheckpoint({ id });
    const rawTxs = await queryTransactionsByDigest({ api, digests: checkpoint.transactions });
    return {
      info: toBlockInfo(checkpoint),
      transactions: rawTxs.filter(tx => !isSettlementTransaction(tx)).map(toBlockTransaction),
    };
  }, currencyId);

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
  api: SuiJsonRpcClient,
  address: string,
  coinType: string,
  requiredAmount: bigint,
) => {
  const coins = [];
  let cursor = null;
  let hasNextPage = true;
  let totalBalance = 0n;

  while (hasNextPage && totalBalance < requiredAmount) {
    const response = await api.getCoins({
      owner: address,
      coinType,
      cursor,
    });

    const validCoins = response.data
      .filter(coin => BigInt(coin.balance) > 0n)
      .sort((a, b) => {
        const diff = BigInt(b.balance) - BigInt(a.balance);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });

    let currentBalance = totalBalance;
    let i = 0;
    while (i < validCoins.length && currentBalance < requiredAmount) {
      const coin = validCoins[i];
      coins.push(coin);
      currentBalance += BigInt(coin.balance);
      i++;
    }
    totalBalance = currentBalance;

    cursor = response.nextCursor;
    hasNextPage = response.hasNextPage && totalBalance < requiredAmount;
  }

  return coins;
};

/**
 * Check whether the sender should fund gas from a real SUI coin object
 * (vs. from the SIP-58 address balance via `setGasPayment([])`).
 *
 * Post SIP-58 the RPC's `getCoins` returns synthetic "fake coin" objects
 * representing address-balance reservations alongside real coins, so we cannot
 * rely on its result to decide. Instead we read `fundsInAddressBalance` from
 * `getAllBalances`: if any address-balance funds exist, prefer them for gas —
 * this avoids picking a real coin object that may be too small for the auto-
 * computed gas budget.
 */
async function hasGasCoinObjects(api: SuiJsonRpcClient, address: string): Promise<boolean> {
  const balances = await api.getAllBalances({ owner: address });
  const sui = balances.find(b => b.coinType === DEFAULT_COIN_TYPE);
  if (!sui) return false;
  const addressBalance = BigInt(sui.fundsInAddressBalance ?? "0");
  if (addressBalance > 0n) return false;
  return BigInt(sui.totalBalance) > 0n;
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
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean = false,
  resolution?: Resolution,
  currencyId?: string,
): Promise<CoreTransaction> => {
  const { serialized, bcsObjects } = await createTransactionFromMode(
    address,
    transaction,
    withObjects,
    currencyId,
  );

  return {
    unsigned: serialized,
    ...(withObjects ? { objects: bcsObjects } : {}),
    ...(transaction.coinType !== DEFAULT_COIN_TYPE && resolution ? { resolution } : {}),
  };
};

const createTransactionFromMode = (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  currencyId?: string,
) => {
  const { mode } = transaction;
  switch (mode) {
    case "delegate":
      return createTransactionForDelegate(address, transaction, withObjects, currencyId);
    case "undelegate":
      return createTransactionForUndelegate(address, transaction, withObjects, currencyId);
    default:
      return createTransactionForOthers(address, transaction, withObjects, currencyId);
  }
};

/**
 * SIP-58: when no coin objects exist, `setGasPayment([])` tells the network
 * to source gas from the address balance via FundsWithdrawal.
 */
const createTransactionForDelegate = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  currencyId?: string,
) =>
  withApi(async api => {
    const tx = new Transaction();
    const sender = ensureAddressFormat(address);
    tx.setSender(sender);

    const senderHasGasCoins = await hasGasCoinObjects(api, sender);
    if (!senderHasGasCoins) {
      tx.setGasPayment([]);
    }

    const { amount } = transaction;
    // When gas is paid from the SIP-58 address balance (`setGasPayment([])`),
    // `tx.gas` is sized only for the auto-computed gas budget, so we can't
    // split the stake amount out of it. Resolve it via `coinWithBalance`,
    // which the SDK turns into a FundsWithdrawal sized for the stake amount.
    const stakeCoin = senderHasGasCoins
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

    const serialized = await tx.build({ client: api });
    const bcsObjects = withObjects
      ? (await getInputObjects(tx, withBatchedMultiGetObjects(api))).bcsObjects
      : [];

    return { serialized, bcsObjects };
  }, currencyId);

const createTransactionForUndelegate = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  currencyId?: string,
) =>
  withApi(async api => {
    const tx = new Transaction();
    const sender = ensureAddressFormat(address);
    tx.setSender(sender);

    if (!(await hasGasCoinObjects(api, sender))) {
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

    const serialized = await tx.build({ client: api });
    const bcsObjects = withObjects
      ? (await getInputObjects(tx, withBatchedMultiGetObjects(api))).bcsObjects
      : [];

    return { serialized, bcsObjects };
  }, currencyId);

/**
 * SIP-58 transfer builder:
 *
 * - **Native SUI**: uses `tx.gas` for the transfer. When the sender has no coin
 *   objects `setGasPayment([])` lets the network source gas from address balance.
 *
 * - **Non-SUI tokens**: first tries `getCoinsForAmount` (which may return fake
 *   coins).  If no coin objects are available at all, falls back to
 *   `coinWithBalance` which resolves the funds from the address balance
 *   automatically (including FundsWithdrawal).
 */
const createTransactionForOthers = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean,
  currencyId?: string,
) =>
  withApi(async api => {
    const tx = new Transaction();
    const sender = ensureAddressFormat(address);
    tx.setSender(sender);

    const senderHasGasCoins = await hasGasCoinObjects(api, sender);
    if (!senderHasGasCoins) {
      tx.setGasPayment([]);
    }

    if (transaction.coinType !== DEFAULT_COIN_TYPE) {
      const requiredAmount = BigInt(transaction.amount.toFixed());
      const coins = await getCoinsForAmount(api, sender, transaction.coinType, requiredAmount);
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
    } else if (senderHasGasCoins) {
      const [coin] = tx.splitCoins(tx.gas, [BigInt(transaction.amount.toFixed())]);
      tx.transferObjects([coin], transaction.recipient);
    } else {
      // SIP-58 native SUI path: gas is paid from address balance via
      // `setGasPayment([])`, so the gas reservation is sized only for fees.
      // We can't split the transfer amount out of `tx.gas`; instead resolve
      // the transfer via `coinWithBalance`, which the SDK turns into a
      // FundsWithdrawal sized for the transfer amount itself.
      const coin = coinWithBalance({ balance: BigInt(transaction.amount.toFixed()) })(tx);
      tx.transferObjects([coin], transaction.recipient);
    }

    const serialized = await tx.build({ client: api });
    const bcsObjects = withObjects
      ? (await getInputObjects(tx, withBatchedMultiGetObjects(api))).bcsObjects
      : [];

    return { serialized, bcsObjects };
  }, currencyId);

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
  sender: string,
  fakeTransaction: TransactionType,
  currencyId?: string,
) =>
  withApi(async api => {
    try {
      const { unsigned: txb } = await createTransaction(
        sender,
        fakeTransaction,
        false,
        undefined,
        currencyId,
      );

      const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
      const fees = getTotalGasUsed(dryRunTxResponse.effects);
      return {
        gasBudget: dryRunTxResponse.input.gasData.budget,
        totalGasUsed: fees,
        fees,
      };
    } catch (error) {
      throw mapDryRunError(error);
    }
  }, currencyId);

export const executeTransactionBlock = async (
  params: ExecuteTransactionBlockParams,
  currencyId?: string,
) =>
  withApi(async api => {
    return api.executeTransactionBlock(params);
  }, currencyId);

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

export const getStakes = (address: string, currencyId?: string): Promise<Stake[]> =>
  withApi(
    async api =>
      api
        .getStakes({ owner: address })
        .then(delegations => delegations.flatMap(delegation => toStakes(address, delegation))),
    currencyId,
  );

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
      return { deposited: BigInt(stake.principal), rewarded: BigInt(stake.estimatedReward) };
    case "Unstaked":
      return { deposited: BigInt(stake.principal), rewarded: 0n }; // note: we lose reward information in unstaked state here
  }
};

/**
 * Active validator set with APY. Two parallel JSON-RPC calls merged by `suiAddress`.
 */
export const getValidators = (currencyId?: string): Promise<SuiValidator[]> =>
  withApi(async api => {
    const [{ activeValidators }, { apys }] = await Promise.all([
      api.getLatestSuiSystemState(),
      api.getValidatorsApy(),
    ]);
    const hash = apys.reduce<Record<string, number>>((acc, item) => {
      acc[item.address] = item.apy;
      return acc;
    }, {});
    return activeValidators.map(item => ({ ...item, apy: hash[item.suiAddress] }));
  }, currencyId);
