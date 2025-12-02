import {
  BalanceChange,
  Checkpoint,
  DelegatedStake,
  ExecuteTransactionBlockParams,
  QueryTransactionBlocksParams,
  StakeObject,
  SuiCallArg,
  SuiClient,
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
  TransactionBlockData,
  TransactionEffects,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import {
  type AccountTransaction,
  type AssetInfo,
  type BalanceDelta,
  type Block,
  type BlockInfo,
  type BlockTransaction,
  Cursor,
  deduceFees,
  Direction,
  type Page,
  type Stake,
  type StakeState,
  type TransactionEvent,
} from "@ledgerhq/coin-framework/api/index";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import uniqBy from "lodash/unionBy";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type {
  CoreTransaction,
  CreateExtrinsicArg,
  SuiValidator,
  Transaction as TransactionType,
} from "../types";
import { ensureAddressFormat } from "../utils";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { getCurrentSuiPreloadData } from "../bridge/preload";
import { ONE_SUI } from "../constants";
import { getInputObjects } from "@mysten/signers/ledger";
import { AccountBalance } from "../../lib/network/sdk";
import { isStaking, isUnstaking } from "./utils";
import { withApi } from "./api";

// ============================================================================
// Constants
// ============================================================================

/** TODO */
export const TRANSACTIONS_LIMIT_PER_QUERY = 50;

/** TODO */
export const TRANSACTIONS_LIMIT = 300;

/** TODO */
const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

/** TODO */
export const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

/** Default options for querying transactions. */
const TRANSACTIONS_QUERY_OPTIONS: SuiTransactionBlockResponseOptions = {
  showInput: true,
  showBalanceChanges: true,
  showEffects: true, // To get transaction status and gas fee details
};

// ============================================================================
// Balances
// ============================================================================

export const getAllBalancesCached = makeLRUCache(
  async (owner: string) => withApi(async api => await api.getAllBalances({ owner })),
  (owner: string) => owner,
  minutes(1),
);

/**
 * Get account balance (native and tokens)
 */
export const getAccountBalances = async (addr: string): Promise<AccountBalance[]> => {
  const balances = await getAllBalancesCached(addr);
  return balances.map(({ coinType, totalBalance }) => ({
    coinType,
    blockHeight: BLOCK_HEIGHT * 2,
    balance: BigNumber(totalBalance),
  }));
};

// ============================================================================
// Blocks
// ============================================================================

/**
 * Get latest checkpoint (a.k.a, block) metadata only.
 *
 * @see {@link getBlock}
 * @see {@link getBlockInfo}
 */
export const getLastBlockInfo = () =>
  withApi(async api => {
    const id = await api.getLatestCheckpointSequenceNumber();
    return await getBlockInfo(id);
  });

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 * @see {@link getBlock}
 * @see {@link getLastBlockInfo}
 */
export const getBlockInfo = async (id: string): Promise<BlockInfo> =>
  withApi(async api => {
    const checkpoint = await api.getCheckpoint({ id });
    return toBlockInfo(checkpoint);
  });

/**
 * Get a checkpoint (a.k.a, a block) metadata with all transactions.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 * @see {@link getBlockInfo}
 * @see {@link getLastBlockInfo}
 */
export const getBlock = async (id: string): Promise<Block> =>
  withApi(async api => {
    const checkpoint = await api.getCheckpoint({ id });
    const rawTxs = await queryTransactionBlocksByDigests({ api, digests: checkpoint.transactions });
    return {
      info: toBlockInfo(checkpoint),
      transactions: rawTxs.map(toBlockTransaction),
    };
  });

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

  if (typeof checkpoint.previousDigest === "string")
    return {
      ...info,
      parent: {
        height: Number(checkpoint.sequenceNumber) - 1,
        hash: checkpoint.previousDigest,
      },
    };

  return info;
}

/**
 * Convert a SUI RPC transaction block response to a {@link BlockTransaction}.
 *
 * Notes:
 *  - transfers are generated from balance changes rather than effects, therefore peer is not populated
 *  - no memo in SUI
 *  - no transaction level details are set
 *
 * @param transaction SUI RPC transaction block response
 */
export function toBlockTransaction(transaction: SuiTransactionBlockResponse): BlockTransaction {
  const feeEvent = toFeeEvent(transaction);
  const transactionEvent = toTransactionEvent(transaction, feeEvent);
  return {
    id: transaction.digest,
    failed: transaction.effects?.status.status !== "success",
    events: [feeEvent, transactionEvent],
    time: getOperationDate(transaction),
  };
}

export function toFeeEvent(transaction: SuiTransactionBlockResponse): TransactionEvent {
  const gas = transaction.effects!.gasUsed;
  const computationCost = BigInt(gas.computationCost);
  const storageCost = BigInt(gas.storageCost);
  const storageRebate = BigInt(gas.storageRebate);
  return {
    type: "FEE",
    balanceDeltas: [
      {
        address: transaction.transaction?.data.sender || "",
        asset: toSuiAsset(DEFAULT_COIN_TYPE),
        delta: -computationCost - storageCost + storageRebate,
      },
    ],
    details: { computationCost, storageCost, storageRebate },
  };
}

export function toTransactionEvent(
  transaction: SuiTransactionBlockResponse,
  feeEvent: TransactionEvent,
): TransactionEvent {
  const balanceDeltasWithFees = transaction.balanceChanges?.flatMap(toBalanceDelta) ?? [];

  const balanceDeltas = deduceFees(balanceDeltasWithFees, feeEvent.balanceDeltas);

  if (isStaking(transaction.transaction?.data.transaction))
    // TODO: add details (see getOperationExtra)
    return { type: "DELEGATE", balanceDeltas };

  if (isUnstaking(transaction.transaction?.data.transaction))
    // TODO: add details (see getOperationExtra)
    return { type: "UNDELEGATE", balanceDeltas };

  return { type: "TRANSFER", balanceDeltas };
}

export function toBalanceDelta(change: BalanceChange): BalanceDelta[] {
  if (typeof change.owner === "string" || !("AddressOwner" in change.owner)) return [];
  return [
    {
      address: change.owner.AddressOwner,
      asset: toSuiAsset(change.coinType),
      delta: BigInt(change.amount),
    },
  ];
}

// ============================================================================
// Transactions
// ============================================================================

/**
 * Fetch operations for Alpaca
 * It fetches separately the "OUT" and "IN" operations and then merge them.
 * The cursor is composed of the last "OUT" and "IN" operation cursors.
 *
 * @returns the operations.
 */
export const getTransactions = async (
  address: string,
  direction?: Direction,
  minHeight?: number,
  maxHeight?: number,
  cursor?: Cursor,
): Promise<Page<AccountTransaction>> => {
  if (minHeight !== undefined) throw new Error("Filtering by minimum height is not supported");
  if (maxHeight !== undefined) throw new Error("Filtering by maximum height is not supported");

  const effectiveDirection = direction ?? "desc";

  return await withApi(async api => {
    const params = { api, address, cursor, direction: effectiveDirection };

    const [transactionsIn, transactionsOut] = await Promise.all([
      await queryTransactionBlocksPageByAddress({ ...params, type: "IN" }),
      await queryTransactionBlocksPageByAddress({ ...params, type: "OUT" }),
    ]);

    const mergedTransactions = mergeTransactions(
      transactionsIn,
      transactionsOut,
      effectiveDirection,
    );

    return {
      items: mergedTransactions.items.map(toAccountTransaction),
      next: mergedTransactions.next,
    };
  });
};

/**
 * Some IN operations are also OUT operations because the sender receive a new version of the coin objects,
 * So IN operations and OUT operations are not disjoint
 * This function will takes the logical lowest operation of the two lists (according so sort order)
 * and remove any higher operation of the other list.
 *
 * Most of the logic have been duplicated from filterOperations (used by bridge).
 *
 * Warning:
 * This function removes some results, so it's not very efficient
 * What we want is the FromOrToAddress filter from SUI RPC, but it's not supported yet
 *
 * Note: I think it's possible to detect duplicated IN operations:
 * - if the address is the sender of the tx
 * - and there is some transfer to other address
 * - and the address is the single only owner of mutated or deleted object
 * when all that conditions are met, the transaction will be fetched as an OUT operation,
 * and it can be filtered out from the IN operations results.
 *
 * @returns a chronologically sorted list of operations without duplicates and
 *          a cursor that guarantee to not return any operation that was already returned in previous calls
 *
 */
export const mergeTransactions = (
  transactionsIn: Page<SuiTransactionBlockResponse>,
  transactionsOut: Page<SuiTransactionBlockResponse>,
  direction: Direction,
): Page<SuiTransactionBlockResponse> => {
  // in asc order, the operations are sorted by timestamp in ascending order
  // in desc order, the operations are sorted by timestamp in descending order

  const getOldestTransactionTime = (txs: SuiTransactionBlockResponse[]): number =>
    Number(txs[txs.length - 1]?.timestampMs ?? 0);

  const getNewestTransactionTime = (txs: SuiTransactionBlockResponse[]): number =>
    Number(txs[0]?.timestampMs ?? 0);

  const getLastTransactionTime = (txs: SuiTransactionBlockResponse[]): number =>
    direction === "asc" ? getNewestTransactionTime(txs) : getOldestTransactionTime(txs);

  // When we've reached the limit for either sent or received operations,
  // we filter out extra operations to maintain correct chronological order
  let lastTxTime: number = 0;
  let nextCursor: Cursor | undefined = undefined;
  if (transactionsIn.next !== undefined || transactionsOut.next !== undefined) {
    const lastOut = getLastTransactionTime(transactionsIn.items);
    const lastIn = getLastTransactionTime(transactionsOut.items);
    if (lastOut >= lastIn) {
      nextCursor = transactionsIn.next;
      lastTxTime = lastOut;
    } else {
      nextCursor = transactionsOut.next;
      lastTxTime = lastIn;
    }
  }
  const operations = [...transactionsIn.items, ...transactionsOut.items]
    .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
    .filter(op => Number(op.timestampMs) >= lastTxTime);

  return { items: uniqBy(operations, tx => tx.digest), next: nextCursor };
};

export function toAccountTransaction(transaction: SuiTransactionBlockResponse): AccountTransaction {
  const tx = toBlockTransaction(transaction);
  return {
    ...tx,
    block: {
      height: Number.parseInt(transaction.checkpoint || "0"),
      time: tx.time,
    },
  };
}

// ============================================================================
// Operations (bridge specific)
// ============================================================================

/**
 * Fetch operation list
 */
export const getLiveOperations = async (
  accountId: string,
  address: string,
  cursor?: QueryTransactionBlocksParams["cursor"],
  direction?: Direction,
): Promise<Operation[]> => {
  return withApi(async api => {
    // Note the direction rules are tricky here:
    //  - either a direction is imposed
    //  - or, by default:
    //    - if we have a pagination cursor direction defaults to ascending
    //    - if we don't, direction is descending
    const effectiveDirection = direction ?? (cursor ? "asc" : "desc");

    const params = { api, address, cursor, direction: effectiveDirection };

    const [transactionsIn, transactionsOut] = await Promise.all([
      await queryTransactionBlocksPageByAddress({ ...params, type: "IN" }),
      await queryTransactionBlocksPageByAddress({ ...params, type: "OUT" }),
    ]);

    // When restoring state (no cursor provided) we filter out extra operations to maintain correct chronological order
    const mergedTransactions = mergeTransactionsForLive(transactionsIn, transactionsOut, !cursor);

    return mergedTransactions.items.map(transaction =>
      toLiveOperation(accountId, address, transaction),
    );
  });
};

export const mergeTransactionsForLive = (
  transactionsIn: Page<SuiTransactionBlockResponse>,
  transactionsOut: Page<SuiTransactionBlockResponse>,
  shouldFilter: boolean = true,
): Page<SuiTransactionBlockResponse> => {
  let filterTimestamp: number = 0;
  let nextCursor: Cursor | undefined = undefined;
  // When we've reached the limit for either sent or received operations,
  // we filter out extra operations to maintain correct chronological order
  if (
    shouldFilter &&
    transactionsOut.items.length &&
    transactionsIn.items.length &&
    (transactionsOut.items.length === TRANSACTIONS_LIMIT ||
      transactionsIn.items.length === TRANSACTIONS_LIMIT)
  ) {
    const getLastTransactionTime = (txs: SuiTransactionBlockResponse[]): number =>
      Number(txs[txs.length - 1]?.timestampMs ?? 0);

    const sendTime = getLastTransactionTime(transactionsOut.items);
    const receiveTime = getLastTransactionTime(transactionsIn.items);
    if (sendTime >= receiveTime) {
      nextCursor = transactionsOut.next;
      filterTimestamp = sendTime;
    } else {
      nextCursor = transactionsIn.next;
      filterTimestamp = receiveTime;
    }
  }
  const transactions: SuiTransactionBlockResponse[] = [...transactionsOut.items, ...transactionsIn.items]
    .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
    .filter(op => Number(op.timestampMs) >= filterTimestamp);

  return {
    items: uniqBy<SuiTransactionBlockResponse>(transactions, tx => tx.digest),
    cursor: nextCursor,
  };
};

/**
 * Map the Sui history transaction to a Ledger Live Operation
 */
export function toLiveOperation(
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
  if (!isSender(addr, transaction?.data)) return "IN";
  if (isStaking(transaction?.data.transaction)) return "DELEGATE";
  if (isUnstaking(transaction?.data.transaction)) return "UNDELEGATE";
  return "OUT";
}

/**
 * Extract senders from transaction
 */
export const getOperationSenders = (transaction?: TransactionBlockData): string[] => {
  const sender = transaction?.sender;
  return sender ? [sender] : [];
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
  let amount = new BigNumber(0);
  if (!transaction?.balanceChanges) return amount;
  if (
    isStaking(transaction.transaction?.data.transaction) ||
    isUnstaking(transaction.transaction?.data.transaction)
  ) {
    const balanceChange = transaction.balanceChanges[0];
    return amount.minus(balanceChange?.amount || 0);
  }

  for (const balanceChange of transaction.balanceChanges) {
    if (
      typeof balanceChange.owner !== "string" &&
      "AddressOwner" in balanceChange.owner &&
      balanceChange.owner.AddressOwner === address
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

export const getOperationExtra = (digest: string): Promise<Record<string, string>> =>
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
        e => e.type === "0x3::validator::UnstakingRequestEvent",
      )?.parsedJson as Record<string, string>;
      const name = getCurrentSuiPreloadData().validators.find(x => x.suiAddress === address)?.name;

      return { amount, address, name: name || "" };
    }

    return {};
  });

/**
 * Extract date from transaction
 */
export const getOperationDate = (transaction: SuiTransactionBlockResponse): Date => {
  return new Date(parseInt(transaction.timestampMs!));
};

/**
 * Extract operation coin type from transaction
 */
export const getOperationCoinType = (transaction: SuiTransactionBlockResponse): string => {
  if (!transaction.balanceChanges) {
    return DEFAULT_COIN_TYPE;
  }
  const tokenBalanceChanges = transaction.balanceChanges.filter(
    ({ coinType }) => coinType !== DEFAULT_COIN_TYPE,
  );
  if (tokenBalanceChanges.length > 0) {
    return tokenBalanceChanges[0].coinType;
  }
  return DEFAULT_COIN_TYPE;
};

/**
 * Convert a SUI coin type to a {@link AssetInfo}.
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

// ============================================================================
// Transaction requests (shared between bridge / alpaca)
// ============================================================================

/**
 * Fetch operations for a specific address and type until the limit is reached
 */
export const queryTransactionBlocksByAddress = async ({
  cursor,
  ...params
}: {
  api: SuiClient;
  address: string;
  type: OperationType;
  direction: Direction;
  cursor?: QueryTransactionBlocksParams["cursor"];
}): Promise<Page<SuiTransactionBlockResponse>> => {
  try {
    const items: SuiTransactionBlockResponse[] = [];
    let next: Cursor | undefined;

    do {
      const page = await queryTransactionBlocksPageByAddress({ ...params, cursor });
      items.push(...page.items);
      next = page.next;
    } while (next !== undefined && items.length < TRANSACTIONS_LIMIT);

    return { items, next };
  } catch (error: unknown) {
    if (error.type === "InvalidParams") {
      log("coin:sui", "(network/sdk): loadOperations failed with cursor, retrying without it", {
        error,
        params,
      });
    } else {
      log("coin:sui", "(network/sdk): loadOperations error", { error, params });
    }
    throw error;
  }
};

/**
 * Query transactions for given address from RPC
 */
export const queryTransactionBlocksPageByAddress = async (params: {
  api: SuiClient;
  address: string;
  type: OperationType;
  direction: Direction;
  cursor?: QueryTransactionBlocksParams["cursor"];
}): Promise<Page<SuiTransactionBlockResponse>> => {
  const { api, address, type, cursor, direction } = params;

  const order = direction === "asc" ? "ascending" : "descending";

  // what we really want is the FromOrToAddress filter, but it's not supported yet
  // it would relieve a lot of complexity (see dedupOperations)
  const filter: QueryTransactionBlocksParams["filter"] =
    type === "IN" ? { ToAddress: address } : { FromAddress: address };

  const page = await api.queryTransactionBlocks({
    filter,
    cursor,
    order,
    options: TRANSACTIONS_QUERY_OPTIONS,
    limit: TRANSACTIONS_LIMIT_PER_QUERY,
  });

  return { items: page.data, next: page.nextCursor ?? undefined };
};

/**
 * Query multiple transactions by digest from the RPC.
 *
 * Note that transaction limit per query applies (usually {@link TRANSACTIONS_LIMIT_PER_QUERY}, but can vary
 * depending on the RPC settings).
 */
export const queryTransactionBlocksByDigests = async (params: {
  api: SuiClient;
  digests: string[];
}): Promise<SuiTransactionBlockResponse[]> => {
  const { api, digests } = params;
  const chunkSize = TRANSACTIONS_LIMIT_PER_QUERY;
  const responses: SuiTransactionBlockResponse[] = [];

  for (let i = 0; i < digests.length; i += chunkSize) {
    const chunk = await api.multiGetTransactionBlocks({
      digests: digests.slice(i, i + chunkSize),
      options: TRANSACTIONS_QUERY_OPTIONS,
    });
    responses.push(...chunk);
  }

  return responses;
};

// ============================================================================
// Stakes
// ============================================================================

/**
 * Get stakes/delegations for an address, returning untransformed data.
 *
 * @param owner owner address
 */
export const getStakesRaw = (owner: string) =>
  withApi(async api => {
    return api.getStakes({ owner });
  });

/**
 * Get stakes/delegations for an address.
 *
 * @param address owner address
 */
export const getStakes = (address: string): Promise<Stake[]> =>
  getStakesRaw(address).then(delegations =>
    delegations.flatMap(delegation => toStakes(address, delegation)),
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

const toStakeState = (status: "Pending" | "Active" | "Unstaked"): StakeState => {
  switch (status) {
    case "Pending":
      return "activating";
    case "Active":
      return "active";
    case "Unstaked":
      return "inactive";
  }
};

const toStakeAmounts = (stake: StakeObject): { deposited: bigint; rewarded: bigint } => {
  switch (stake.status) {
    case "Pending":
      return { deposited: BigInt(stake.principal), rewarded: 0n };
    case "Active":
      return { deposited: BigInt(stake.principal), rewarded: BigInt(stake.estimatedReward) };
    case "Unstaked":
      return { deposited: BigInt(stake.principal), rewarded: 0n }; // note: we lose reward information in unstaked state here
  }
};

// ============================================================================
// Validators
// ============================================================================

/**
 * Query list of validators and their APY for the network.
 */
export const getValidators = (): Promise<SuiValidator[]> =>
  withApi(async api => {
    const [{ activeValidators }, { apys }] = await Promise.all([
      api.getLatestSuiSystemState(),
      api.getValidatorsApy(),
    ]);
    const hash = apys.reduce(
      (acc, item) => {
        acc[item.address] = item.apy;
        return acc;
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as Record<string, number>,
    );

    return activeValidators.map(item => ({ ...item, apy: hash[item.suiAddress] }));
  });

// ============================================================================
// Crafting
// ============================================================================

/**
 * Get coins for a given address and coin type, stopping when we have enough to cover the amount.
 * Returns the minimum coins needed to cover the required amount.
 */
export const getCoinsForAmount = async (
  api: SuiClient,
  address: string,
  coinType: string,
  requiredAmount: number,
) => {
  const coins = [];
  let cursor = null;
  let hasNextPage = true;
  let totalBalance = 0;

  while (hasNextPage && totalBalance < requiredAmount) {
    const response = await api.getCoins({
      owner: address,
      coinType,
      cursor,
    });

    // Filter out zero-balance coins and sort by balance (largest first)
    const validCoins = response.data
      .filter(coin => parseInt(coin.balance) > 0)
      .sort((a, b) => parseInt(b.balance) - parseInt(a.balance));

    let currentBalance = totalBalance;
    let i = 0;
    while (i < validCoins.length && currentBalance < requiredAmount) {
      const coin = validCoins[i];
      coins.push(coin);
      currentBalance += parseInt(coin.balance);
      i++;
    }
    totalBalance = currentBalance;

    cursor = response.nextCursor;
    hasNextPage = response.hasNextPage && totalBalance < requiredAmount;
  }

  return coins;
};

/**
 * Creates a Sui transaction block for transferring coins.
 *
 * @param address - The sender's address
 * @param transaction - The transaction details including recipient, amount, and coin type
 * @param withObjects - Return serialized input objects used in the transaction
 * @returns Promise<TransactionBlock> - A built transaction block ready for execution
 *
 */
export const createTransaction = async (
  address: string,
  transaction: CreateExtrinsicArg,
  withObjects: boolean = false,
): Promise<CoreTransaction> =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(address));
    const { mode, amount } = transaction;
    switch (mode) {
      case "delegate": {
        const coins = tx.splitCoins(tx.gas, [amount.toNumber()]);
        tx.moveCall({
          target: "0x3::sui_system::request_add_stake",
          arguments: [
            tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
            coins,
            tx.pure.address(transaction.recipient),
          ],
        });

        tx.setGasBudgetIfNotSet(ONE_SUI / 10);
        break;
      }
      case "undelegate": {
        if (transaction.useAllAmount) {
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
        break;
      }
      default: {
        if (transaction.coinType !== DEFAULT_COIN_TYPE) {
          const requiredAmount = transaction.amount.toNumber();

          const coins = await getCoinsForAmount(api, address, transaction.coinType, requiredAmount);

          if (coins.length === 0) {
            throw new Error(`No coins found for type ${transaction.coinType}`);
          }

          const coinObjects = coins.map(coin => tx.object(coin.coinObjectId));

          if (coinObjects.length > 1) {
            tx.mergeCoins(coinObjects[0], coinObjects.slice(1));
          }

          const [coin] = tx.splitCoins(coinObjects[0], [transaction.amount.toNumber()]);
          tx.transferObjects([coin], transaction.recipient);
        } else {
          const [coin] = tx.splitCoins(tx.gas, [transaction.amount.toNumber()]);
          tx.transferObjects([coin], transaction.recipient);
        }
      }
    }

    const serialized = await tx.build({ client: api });

    if (withObjects) {
      const { bcsObjects } = await getInputObjects(tx, api);
      return { unsigned: serialized, objects: bcsObjects as Uint8Array[] };
    }

    return { unsigned: serialized };
  });

// ============================================================================
// Fees estimation
// ============================================================================

/**
 * Performs a dry run of a transaction to estimate gas costs and fees
 */
export const paymentInfo = async (sender: string, fakeTransaction: TransactionType) =>
  withApi(async api => {
    const { unsigned: txb } = await createTransaction(sender, fakeTransaction);
    const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
    const fees = getTotalGasUsed(dryRunTxResponse.effects);

    return {
      gasBudget: dryRunTxResponse.input.gasData.budget,
      totalGasUsed: fees,
      fees,
    };
  });

const getTotalGasUsed = (effects?: TransactionEffects | null): bigint => {
  const gasSummary = effects?.gasUsed;
  if (!gasSummary) return BigInt(0);
  return (
    BigInt(gasSummary.computationCost) +
    BigInt(gasSummary.storageCost) -
    BigInt(gasSummary.storageRebate)
  );
};

// ============================================================================
// Broadcast
// ============================================================================

export const executeTransactionBlock = async (params: ExecuteTransactionBlockParams) =>
  withApi(async api => api.executeTransactionBlock(params));
