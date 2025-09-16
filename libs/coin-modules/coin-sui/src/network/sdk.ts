import {
  BalanceChange,
  Checkpoint,
  ExecuteTransactionBlockParams,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  SuiCallArg,
  SuiClient,
  SuiHTTPTransport,
  SuiTransactionBlockResponse,
  SuiTransaction,
  SuiTransactionBlockKind,
  TransactionEffects,
  SuiTransactionBlockResponseOptions,
  DelegatedStake,
  StakeObject,
  TransactionBlockData,
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
import type { Transaction as TransactionType, SuiValidator, CreateExtrinsicArg } from "../types";
import { ensureAddressFormat } from "../utils";
import coinConfig from "../config";
import { getEnv } from "@ledgerhq/live-env";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { getCurrentSuiPreloadData } from "../bridge/preload";
import { ONE_SUI } from "../constants";
import bs58 from "bs58";

const apiMap: Record<string, SuiClient> = {};
type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

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
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  if (options) {
    options.headers = {
      ...options.headers,
      "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
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

export const getAllBalancesCached = makeLRUCache(
  async (owner: string) =>
    withApi(
      async api =>
        await api.getAllBalances({
          owner,
        }),
    ),
  (owner: string) => owner,
  minutes(1),
);
function isStaking(block?: SuiTransactionBlockKind): block is {
  inputs: SuiCallArg[];
  kind: "ProgrammableTransaction";
  transactions: SuiTransaction[];
} {
  if (!block) return false;
  if (block.kind === "ProgrammableTransaction") {
    const move = block.transactions.find(item => "MoveCall" in item) as any;
    return move?.MoveCall.function === "request_add_stake";
  }
  return false;
}

function isUnstaking(block?: SuiTransactionBlockKind): block is {
  inputs: SuiCallArg[];
  kind: "ProgrammableTransaction";
  transactions: SuiTransaction[];
} {
  if (!block) return false;
  if (block.kind === "ProgrammableTransaction") {
    const move = block.transactions.find(
      item => "MoveCall" in item && item["MoveCall"].function === "request_withdraw_stake",
    ) as any;
    return Boolean(move);
  }
  return false;
}

/**
 * Get account balance (native and tokens)
 */
export const getAccountBalances = async (addr: string) => {
  const balances = await getAllBalancesCached(addr);
  return balances.map(({ coinType, totalBalance }) => ({
    coinType,
    blockHeight: BLOCK_HEIGHT * 2,
    balance: BigNumber(totalBalance),
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
    if (isUnstaking(transaction.transaction) || isStaking(transaction.transaction)) return [];
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

export const getStakesRaw = (owner: string) =>
  withApi(async api => {
    return api.getStakes({ owner });
  });

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
 * @returns the operation converted. Note that if param `transaction` was retrieved as an "IN" operations, the type may be converted to "OUT".
 *    It happens for most "OUT" operations because the sender receive a new version of the coin objects.
 */
export function transactionToOp(address: string, transaction: SuiTransactionBlockResponse): Op {
  const type = getOperationType(address, transaction);
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
 *  - transfers are generated from balance changes rather than effects,
 * therefore the peer is not populated.
 *  - all other operation types are ignored
 *
 * @param transaction SUI RPC transaction block response
 */
export function toBlockTransaction(transaction: SuiTransactionBlockResponse): BlockTransaction {
  return {
    hash: transaction.digest,
    failed: transaction.effects?.status.status !== "success",
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
  if (typeof change.owner === "string" || !("AddressOwner" in change.owner)) return [];
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
  order?: "asc" | "desc",
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

    return rawTransactions.operations.map(transaction =>
      transactionToOperation(accountId, addr, transaction),
    );
  });

export const filterOperations = (
  sendOps: LoadOperationResponse,
  receiveOps: LoadOperationResponse,
  order: "ascending" | "descending",
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

type Cursor = {
  out?: string;
  in?: string;
};

function serializeCursor(cursor: Cursor): string | undefined {
  return cursor.in || cursor.out ? bs58.encode(Buffer.from(JSON.stringify(cursor))) : undefined;
}

function deserializeCursor(b58cursor: string | undefined): Cursor {
  return b58cursor
    ? (JSON.parse(Buffer.from(bs58.decode(b58cursor)).toString()) as Cursor)
    : ({} as Cursor);
}

function toSdkCursor(cursor: string | undefined): QueryTransactionBlocksParams["cursor"] {
  const ret: QueryTransactionBlocksParams["cursor"] = cursor;
  return ret;
}

/**
 * Fetch operations for Alpaca
 * It fetches separately the "OUT" and "IN" operations and then merge them.
 * The cursor is composed of the last "OUT" and "IN" operation cursors.
 *
 * Warning:
 * Some IN operations are also OUT operations because the sender receive a new version of the coin objects,
 * and the complexity of this function don't go that far to detect it.
 * IN calls and OUT calls are not disjoint
 * Consequence: 2 successive calls of this function when passing cursor may return an operation we already saw in previous calls,
 * fetched as an OUT operation.
 *
 * Note: I think it's possible to detect duplicated IN oprations:
 * - if the address is the sender of the tx
 * - and there is some transfer to other address
 * - and the address is the single only owner of mutated or deleted object
 * when all that conditions are met, the transaction will be fetched as an OUT operation,
 * and it can be filtered out from the IN operations results.
 *
 * @returns the operations.
 *
 */
export const getListOperations = async (
  addr: string,
  order: "asc" | "desc",
  withApiImpl: typeof withApi = withApi,
  cursor?: string,
): Promise<Page<Op>> =>
  withApiImpl(async api => {
    const rpcOrder = convertApiOrderToSdkOrder(order);
    const { out: outCursor, in: inCursor } = deserializeCursor(cursor);

    const [opsOut, opsIn] = await Promise.all([
      queryTransactions({
        api,
        addr,
        type: "OUT",
        cursor: toSdkCursor(outCursor),
        order: rpcOrder,
      }),
      queryTransactions({
        api,
        addr,
        type: "IN",
        cursor: toSdkCursor(inCursor),
        order: rpcOrder,
      }),
    ]);

    const ops = [...opsOut.data, ...opsIn.data]
      .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
      .map(t => transactionToOp(addr, t));

    const nextCursor: Cursor = {};
    if (opsOut.hasNextPage && opsOut.nextCursor) {
      nextCursor.out = opsOut.nextCursor;
    }
    if (opsIn.hasNextPage && opsIn.nextCursor) {
      nextCursor.in = opsIn.nextCursor;
    }

    return {
      items: ops,
      next: serializeCursor(nextCursor),
    };
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
 * @returns Promise<TransactionBlock> - A built transaction block ready for execution
 *
 */
export const createTransaction = async (address: string, transaction: CreateExtrinsicArg) =>
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

    return tx.build({ client: api });
  });

/**
 * Performs a dry run of a transaction to estimate gas costs and fees
 */
export const paymentInfo = async (sender: string, fakeTransaction: TransactionType) =>
  withApi(async api => {
    const txb = await createTransaction(sender, fakeTransaction);
    const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
    const fees = getTotalGasUsed(dryRunTxResponse.effects);

    return {
      gasBudget: dryRunTxResponse.input.gasData.budget,
      totalGasUsed: fees,
      fees,
    };
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
      {} as Record<string, number>,
    );

    return activeValidators.map(item => ({ ...item, apy: hash[item.suiAddress] }));
  });
