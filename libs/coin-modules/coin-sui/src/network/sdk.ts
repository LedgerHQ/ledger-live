import {
  Checkpoint,
  ExecuteTransactionBlockParams,
  PaginatedTransactionResponse,
  SuiCallArg,
  SuiClient,
  SuiTransactionBlockResponse,
  TransactionBlockData,
  SuiHTTPTransport,
  TransactionEffects,
  QueryTransactionBlocksParams,
  BalanceChange,
  SuiTransactionBlockResponseOptions,
  DelegatedStake,
  StakeObject,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import type {
  Block,
  BlockInfo,
  BlockTransaction,
  BlockOperation,
  Operation as Op,
  Page,
  Stake,
  StakeState,
  AssetInfo,
} from "@ledgerhq/coin-framework/api/index";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import uniqBy from "lodash/unionBy";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { Transaction as TransactionType } from "../types";
import type { CreateExtrinsicArg } from "../logic/craftTransaction";
import { ensureAddressFormat } from "../utils";
import coinConfig from "../config";
import { getEnv } from "@ledgerhq/live-env";

type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

const apiMap: Record<string, SuiClient> = {};

export const TRANSACTIONS_LIMIT_PER_QUERY = 50;
export const TRANSACTIONS_LIMIT = 300;
const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

export const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

/** Default options for querying transactions. */
const TRANSACTIONS_QUERY_OPTIONS: SuiTransactionBlockResponseOptions = {
  showInput: true,
  showBalanceChanges: true,
  showEffects: true, // To get transaction status and gas fee details
};

type GenericInput<T> = T extends (...args: infer K) => unknown ? K : never;
type Inputs = GenericInput<typeof fetch>;

const fetcher = (url: Inputs[0], options: Inputs[1], retry = 3): Promise<Response> => {
  if (options) {
    options.headers = {
      ...options.headers,
      "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION"),
    };
  }
  if (retry === 1) return fetch(url, options);

  return fetch(url, options).catch(() => fetcher(url, options, retry - 1));
};

/**
 * Connects to Sui Api
 */
export async function withApi<T>(execute: AsyncApiFunction<T>) {
  const url = coinConfig.getCoinConfig().node.url;
  const transport = new SuiHTTPTransport({
    url,
    fetch: fetcher,
  });

  apiMap[url] ??= new SuiClient({ transport });

  const result = await execute(apiMap[url]);
  return result;
}

export const getBalanceCached = makeLRUCache(
  ({ api, owner }: { api: SuiClient; owner: string }) => api.getBalance({ owner }),
  (params: { api: SuiClient; owner: string }) => params.owner,
  minutes(1),
);

export const getAllBalancesCached = makeLRUCache(
  ({ api, owner }: { api: SuiClient; owner: string }) =>
    api.getAllBalances({
      owner,
    }),
  (params: { api: SuiClient; owner: string }) => params.owner,
  minutes(1),
);

/**
 * Get account balance
 */
export const getAccount = async (addr: string) =>
  withApi(async api => {
    const balance = await getBalanceCached({ api, owner: addr });
    return {
      blockHeight: BLOCK_HEIGHT * 2,
      balance: BigNumber(balance.totalBalance),
    };
  });

/**
 * Get account balance (native and tokens)
 */
export const getAccountBalances = async (addr: string) =>
  withApi(async api => {
    const balances = await getAllBalancesCached({ api, owner: addr });
    return balances.map(({ coinType, totalBalance }) => ({
      coinType,
      blockHeight: BLOCK_HEIGHT * 2,
      balance: BigNumber(totalBalance),
    }));
  });

/**
 * Returns true if account is the signer
 */
export function isSender(addr: string, transaction?: TransactionBlockData): boolean {
  return transaction?.sender === ensureAddressFormat(addr);
}

/**
 * Map transaction to an Operation Type
 */
export function getOperationType(addr: string, transaction?: TransactionBlockData): OperationType {
  return isSender(addr, transaction) ? "OUT" : "IN";
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
  if (transaction?.transaction.kind === "ProgrammableTransaction") {
    if (!transaction?.transaction?.inputs) return [];
    const recipients: string[] = [];
    transaction.transaction.inputs.forEach((input: SuiCallArg) => {
      if ("valueType" in input && input.valueType === "address") {
        recipients.push(String(input.value));
      }
    });
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
 * Map the Sui history transaction to a Ledger Live Operation
 */
export function transactionToOperation(
  accountId: string,
  address: string,
  transaction: SuiTransactionBlockResponse,
): Operation {
  const type = getOperationType(address, transaction.transaction?.data);

  const coinType = getOperationCoinType(transaction);
  const hash = transaction.digest;

  return {
    id: encodeOperationId(accountId, hash, type),
    accountId,
    blockHash: hash,
    blockHeight: BLOCK_HEIGHT,
    date: getOperationDate(transaction),
    extra: {
      coinType,
    },
    fee: getOperationFee(transaction),
    hasFailed: transaction.effects?.status.status != "success",
    hash,
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: getOperationAmount(address, transaction, coinType),
  };
}

export function transactionToOp(address: string, transaction: SuiTransactionBlockResponse): Op {
  const type = getOperationType(address, transaction.transaction?.data);
  const coinType = getOperationCoinType(transaction);
  const hash = transaction.digest;
  return {
    id: hash,
    tx: {
      date: getOperationDate(transaction),
      hash,
      fees: BigInt(getOperationFee(transaction).toString()),
      block: {
        // agreed to return bigint
        height: BigInt(transaction.checkpoint || "") as unknown as number,
        hash,
        time: getOperationDate(transaction),
      },
    },
    asset: toSuiAsset(coinType),
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: BigInt(getOperationAmount(address, transaction, coinType).toString()),
  };
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

  if (typeof checkpoint.previousDigest == "string")
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
 *  - transfers are generated from balance changes rather than effects,
 * therefore the peer is not populated.
 *  - all other operation types are ignored
 *
 * @param transaction SUI RPC transaction block response
 */
export function toBlockTransaction(transaction: SuiTransactionBlockResponse): BlockTransaction {
  return {
    hash: transaction.digest,
    failed: transaction.effects?.status.status != "success",
    operations: transaction.balanceChanges?.flatMap(toBlockOperation) || [],
    fees: BigInt(getOperationFee(transaction).toString()),
    feesPayer: transaction.transaction?.data.sender || "",
  };
}

/**
 * Convert a SUI RPC transaction balance change to a {@link BlockOperation}.
 *
 * @param change balance change
 */
export function toBlockOperation(change: BalanceChange): BlockOperation[] {
  if (typeof change.owner == "string" || !("AddressOwner" in change.owner)) return [];
  return [
    {
      type: "transfer",
      address: change.owner.AddressOwner,
      asset: toSuiAsset(change.coinType),
      amount: BigInt(change.amount),
    },
  ];
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

export const getLastBlock = () =>
  withApi(async api => {
    const checkpoint = await api.getLatestCheckpointSequenceNumber();
    const { digest, sequenceNumber, timestampMs } = await api.getCheckpoint({ id: checkpoint });

    return { digest, sequenceNumber, timestampMs };
  });

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  cursor?: QueryTransactionBlocksParams["cursor"],
): Promise<Operation[]> =>
  withApi(async api => {
    const sendOps = await loadOperations({
      api,
      addr,
      type: "OUT",
      cursor,
      order: cursor ? "ascending" : "descending",
      operations: [],
    });
    const receivedOps = await loadOperations({
      api,
      addr,
      type: "IN",
      cursor,
      order: cursor ? "ascending" : "descending",
      operations: [],
    });
    // When restoring state (no cursor provided) we filter out extra operations to maintain correct chronological order
    const rawTransactions = filterOperations(sendOps, receivedOps, !cursor);

    return rawTransactions.operations.map(transaction =>
      transactionToOperation(accountId, addr, transaction)
    );
  });

export const filterOperations = (
  sendOps: LoadOperationResponse,
  receiveOps: LoadOperationResponse,
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
    (sendOps.operations.length === TRANSACTIONS_LIMIT || receiveOps.operations.length === TRANSACTIONS_LIMIT)
  ) {
    const sendTime = Number(sendOps.operations[sendOps.operations.length - 1].timestampMs ?? 0);
    const receiveTime = Number(receiveOps.operations[receiveOps.operations.length - 1].timestampMs ?? 0);
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

/**
 * Fetch operations for Alpaca
 */
export const getListOperations = async (
  addr: string,
  cursor: QueryTransactionBlocksParams["cursor"] = null,
  withApiImpl: typeof withApi = withApi,
): Promise<Page<Op>> =>
  withApiImpl(async api => {
    const opsOut = await loadOperations({
      api,
      addr,
      type: "OUT",
      cursor,
      order: cursor ? "ascending" : "descending",
      operations: [],
    });
    const opsIn = await loadOperations({
      api,
      addr,
      type: "IN",
      cursor,
      order: cursor ? "ascending" : "descending",
      operations: [],
    });
    const list = filterOperations(opsIn, opsOut, true);

    return { items: list.operations.map(t => transactionToOp(addr, t)), next: list.cursor ?? undefined};
  });

/**
 * Get a checkpoint (a.k.a, a block) metadata.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 */
export const getCheckpoint = async (id: string): Promise<Checkpoint> =>
  withApi(async api => api.getCheckpoint({ id }));

/**
 * Get a checkpoint (a.k.a, a block) metadata only.
 *
 * @param id the checkpoint digest or sequence number (as a string)
 * @see {@link getBlock}
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
 */
export const getBlock = async (id: string): Promise<Block> =>
  withApi(async api => {
    const checkpoint = await api.getCheckpoint({ id });
    const rawTxs = await queryTransactionsByDigest({ api, digests: checkpoint.transactions });
    return {
      info: toBlockInfo(checkpoint),
      transactions: rawTxs.map(toBlockTransaction),
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

const FALLBACK_GAS_BUDGET = {
  SUI_TRANSFER: "3976000",
  TOKEN_TRANSFER: "4461792",
};

export const paymentInfo = async (sender: string, fakeTransaction: TransactionType) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(sender));
    const coinObjects = await getCoinObjectIds(sender, fakeTransaction);

    const [coin] = tx.splitCoins(Array.isArray(coinObjects) ? coinObjects[0] : tx.gas, [
      fakeTransaction.amount.toNumber(),
    ]);
    tx.transferObjects([coin], fakeTransaction.recipient);

    try {
      const txb = await tx.build({ client: api });
      const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
      const fees = getTotalGasUsed(dryRunTxResponse.effects);

      return {
        gasBudget: dryRunTxResponse.input.gasData.budget,
        totalGasUsed: fees,
        fees,
      };
    } catch (error) {
      console.warn("Fee estimation failed:", error);
      // If dry run fails return a reasonable default gas budget as fallback
      return {
        gasBudget: Array.isArray(coinObjects)
          ? FALLBACK_GAS_BUDGET.TOKEN_TRANSFER
          : FALLBACK_GAS_BUDGET.SUI_TRANSFER,
        totalGasUsed: BigInt(1000000),
        fees: BigInt(1000000),
      };
    }
  });

export const getCoinObjectIds = async (
  address: string,
  transaction: CreateExtrinsicArg | TransactionType,
) =>
  withApi(async api => {
    const coinObjectId = null;

    if (transaction.coinType !== DEFAULT_COIN_TYPE) {
      const tokenInfo = await api.getCoins({
        owner: address,
        coinType: transaction.coinType,
      });
      return tokenInfo.data.map(coin => coin.coinObjectId);
    }
    return coinObjectId;
  });

export const createTransaction = async (address: string, transaction: CreateExtrinsicArg) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(address));

    const coinObjects = await getCoinObjectIds(address, transaction);

    if (Array.isArray(coinObjects) && transaction.coinType !== DEFAULT_COIN_TYPE) {
      const coins = coinObjects.map(coinId => tx.object(coinId));
      if (coins.length > 1) {
        tx.mergeCoins(coins[0], coins.slice(1));
      }
      const [coin] = tx.splitCoins(coins[0], [transaction.amount.toNumber()]);
      tx.transferObjects([coin], transaction.recipient);
    } else {
      const [coin] = tx.splitCoins(tx.gas, [transaction.amount.toNumber()]);
      tx.transferObjects([coin], transaction.recipient);
    }

    return tx.build({ client: api });
  });

export const executeTransactionBlock = async (params: ExecuteTransactionBlockParams) =>
  withApi(async api => {
    return api.executeTransactionBlock(params);
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
  api: SuiClient;
  addr: string;
  type: OperationType;
  operations: PaginatedTransactionResponse["data"];
  order: "ascending" | "descending";
  cursor?: QueryTransactionBlocksParams["cursor"];
}): Promise<LoadOperationResponse> => {
  try {
    if (order === "descending" && operations.length >= TRANSACTIONS_LIMIT) {
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
  api: SuiClient;
  addr: string;
  type: OperationType;
  order: "ascending" | "descending";
  cursor?: QueryTransactionBlocksParams["cursor"];
}): Promise<PaginatedTransactionResponse> => {
  const { api, addr, type, cursor, order } = params;
  const filter: QueryTransactionBlocksParams["filter"] =
    type === "IN" ? { ToAddress: addr } : { FromAddress: addr };

  return await api.queryTransactionBlocks({
    filter,
    cursor,
    order,
    options: TRANSACTIONS_QUERY_OPTIONS,
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

export const getStakes = (address: string): Promise<Stake[]> =>
  withApi(async api =>
    api
      .getStakes({ owner: address })
      .then(delegations => delegations.flatMap(delegation => toStakes(address, delegation))),
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
