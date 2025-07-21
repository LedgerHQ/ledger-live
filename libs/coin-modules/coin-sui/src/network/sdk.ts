import {
  ExecuteTransactionBlockParams,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  SuiClient,
  SuiHTTPTransport,
  TransactionEffects,
} from "@mysten/sui/client";
import { TransactionBlockData, SuiTransactionBlockResponse, SuiCallArg } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import type { Operation as Op } from "@ledgerhq/coin-framework/api/index";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import uniqBy from "lodash/unionBy";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { log } from "@ledgerhq/logs";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { Transaction as TransactionType } from "../types";
import type { CreateExtrinsicArg } from "../logic/craftTransaction";
import { ensureAddressFormat } from "../utils";
import coinConfig from "../config";
import { SuiAsset } from "../api/types";
import { getEnv } from "@ledgerhq/live-env";

type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

const apiMap: Record<string, SuiClient> = {};

export const TRANSACTIONS_LIMIT_PER_QUERY = 50;
export const TRANSACTIONS_LIMIT = 300;
const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

export const DEFAULT_COIN_TYPE = "0x2::sui::SUI";

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

function transactionToOp(address: string, transaction: SuiTransactionBlockResponse): Op<SuiAsset> {
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
    asset: { type: "native" },
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: BigInt(getOperationAmount(address, transaction, coinType).toString()),
  };
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
    const sentOps = await loadOperations({
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
    const rawTransactions = filterOperations(sentOps, receivedOps, cursor);

    return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
  });

export const filterOperations = (
  operationList1: SuiTransactionBlockResponse[],
  operationList2: SuiTransactionBlockResponse[],
  cursor: string | null | undefined,
) => {
  let filterTimestamp = 0;

  // When restoring state (no cursor provided) and we've reached the limit for either sent or received operations,
  // we filter out extra operations to maintain correct chronological order
  if (
    !cursor &&
    operationList1.length &&
    operationList2.length &&
    (operationList1.length === TRANSACTIONS_LIMIT || operationList2.length === TRANSACTIONS_LIMIT)
  ) {
    const aTime = operationList1[operationList1.length - 1].timestampMs ?? 0;
    const bTime = operationList2[operationList2.length - 1].timestampMs ?? 0;
    filterTimestamp = Math.max(Number(aTime), Number(bTime));
  }
  const result = [...operationList1, ...operationList2]
    .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
    .filter(op => Number(op.timestampMs) >= filterTimestamp);

  return uniqBy(result, tx => tx.digest);
};

/**
 * Fetch operations for Alpaca
 */
export const getListOperations = async (
  addr: string,
  cursor: QueryTransactionBlocksParams["cursor"] = null,
  withApiImpl: typeof withApi = withApi,
): Promise<Op<SuiAsset>[]> =>
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
    const list = filterOperations(opsIn, opsOut, cursor);

    return list.map(t => transactionToOp(addr, t));
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
}): Promise<PaginatedTransactionResponse["data"]> => {
  try {
    if (order === "descending" && operations.length >= TRANSACTIONS_LIMIT) {
      return operations;
    }

    const { data, nextCursor, hasNextPage } = await queryTransactions({
      ...params,
      order,
      cursor,
    });

    operations.push(...data);
    if (!hasNextPage) {
      return operations;
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

  return operations;
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
    options: {
      showInput: true,
      showBalanceChanges: true,
      showEffects: true, // To get transaction status and gas fee details
    },
    limit: TRANSACTIONS_LIMIT_PER_QUERY,
  });
};
