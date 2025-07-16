import {
  PaginatedTransactionResponse,
  SuiClient,
  ExecuteTransactionBlockParams,
  TransactionEffects,
  QueryTransactionBlocksParams,
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
import type { CreateExtrinsicArg } from "../logic/craftTransaction";
import { ensureAddressFormat } from "../utils";
import coinConfig from "../config";
import { SuiAsset } from "../api/types";

type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

const apiMap: Record<string, SuiClient> = {};

export const TRANSACTIONS_LIMIT_PER_QUERY = 50;
export const TRANSACTIONS_LIMIT = 300;
const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

/**
 * Connects to Sui Api
 */
async function withApi<T>(execute: AsyncApiFunction<T>) {
  const url = coinConfig.getCoinConfig().node.url;
  if (!apiMap[url]) {
    apiMap[url] = new SuiClient({ url });
  }

  const result = await execute(apiMap[url]);
  return result;
}

export const getBalanceCached = makeLRUCache(
  ({ api, owner }: { api: SuiClient; owner: string }) => api.getBalance({ owner }),
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
        amount = amount.minus(balanceChange.amount);
      } else {
        amount = amount.plus(balanceChange.amount);
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
 * Map the Sui history transaction to a Ledger Live Operation
 */
export function transactionToOperation(
  accountId: string,
  address: string,
  transaction: SuiTransactionBlockResponse,
): Operation {
  const type = getOperationType(address, transaction.transaction?.data);
  const hash = transaction.digest;
  return {
    id: encodeOperationId(accountId, hash, type),
    accountId,
    blockHash: hash,
    blockHeight: BLOCK_HEIGHT,
    date: getOperationDate(transaction),
    extra: {},
    fee: getOperationFee(transaction),
    hasFailed: transaction.effects?.status.status != "success",
    hash,
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: getOperationAmount(address, transaction),
  };
}

function transactionToOp(address: string, transaction: SuiTransactionBlockResponse): Op<SuiAsset> {
  const type = getOperationType(address, transaction.transaction?.data);
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
      },
    },
    asset: { type: "native" },
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    type,
    value: BigInt(getOperationAmount(address, transaction).toString()),
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
  cursor?: string | null | undefined,
): Promise<Operation[]> =>
  withApi(async api => {
    const sentOps = await loadOperations({ api, addr, type: "OUT", cursor });
    const receivedOps = await loadOperations({ api, addr, type: "IN", cursor });
    const rawTransactions = [...sentOps, ...receivedOps].sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs),
    );

    return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
  });

export const getListOperations = async (addr: string, cursor = ""): Promise<Op<SuiAsset>[]> =>
  withApi(async api => {
    const opsOut = await loadOperations({ api, addr, type: "OUT", cursor });
    const opsIn = await loadOperations({ api, addr, type: "IN", cursor });

    const rawTransactions = [...opsIn, ...opsOut].sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs),
    );
    const list = uniqBy(rawTransactions, tx => tx.digest);
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

export const paymentInfo = async (
  sender: string,
  { amount, recipient }: { amount: BigNumber; recipient: string },
) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(sender));
    const [coin] = tx.splitCoins(tx.gas, [amount.toNumber()]);
    tx.transferObjects([coin], recipient);
    const txb = await tx.build({ client: api });
    const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
    const fees = getTotalGasUsed(dryRunTxResponse.effects);
    return {
      gasBudget: dryRunTxResponse.input.gasData.budget,
      totalGasUsed: fees,
      fees,
    };
  });

export const createTransaction = async (address: string, transaction: CreateExtrinsicArg) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(address));

    const [coin] = tx.splitCoins(tx.gas, [transaction.amount.toNumber()]);
    tx.transferObjects([coin], transaction.recipient);

    return tx.build({ client: api });
  });

export const executeTransactionBlock = async (params: ExecuteTransactionBlockParams) =>
  withApi(async api => {
    return api.executeTransactionBlock(params);
  });

/**
 * Fetch operations for a specific address and type until the limit is reached
 */
export const loadOperations = async (params: {
  api: SuiClient;
  addr: string;
  type: OperationType;
  cursor?: string | null | undefined;
}): Promise<PaginatedTransactionResponse["data"]> => {
  const operations: PaginatedTransactionResponse["data"] = [];
  let currentCursor = params.cursor;

  while (operations.length < TRANSACTIONS_LIMIT) {
    try {
      const { data, nextCursor, hasNextPage } = await queryTransactions({
        ...params,
        cursor: currentCursor,
      });

      operations.push(...data);

      // If we got fewer results than the query limit or no more data, we've reached the end
      if (data.length < TRANSACTIONS_LIMIT_PER_QUERY || !hasNextPage) {
        break;
      }

      currentCursor = nextCursor;
    } catch (error: any) {
      if (error.type === "InvalidParams") {
        log("coin:sui", "(network/sdk): loadOperations failed with cursor, retrying without it", {
          error,
          params,
        });

        currentCursor = null;

        continue;
      } else {
        log("coin:sui", "(network/sdk): loadOperations error", { error, params });

        break;
      }
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
  cursor?: string | null | undefined;
}): Promise<PaginatedTransactionResponse> => {
  const { api, addr, type, cursor } = params;
  const filter: QueryTransactionBlocksParams["filter"] =
    type === "IN" ? { ToAddress: addr } : { FromAddress: addr };

  return await api.queryTransactionBlocks({
    filter,
    cursor,
    order: "descending",
    options: {
      showInput: true,
      showBalanceChanges: true,
      showEffects: true, // To get transaction status and gas fee details
    },
    limit: TRANSACTIONS_LIMIT_PER_QUERY,
  });
};
