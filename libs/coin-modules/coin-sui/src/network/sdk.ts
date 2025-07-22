import {
  ExecuteTransactionBlockParams,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  SuiClient,
  SuiHTTPTransport,
  SuiTransaction,
  SuiTransactionBlockKind,
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
import type { SuiValidator } from "../types";
import { SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { getCurrentSuiPreloadData } from "../bridge/preload";

const apiMap: Record<string, SuiClient> = {};
type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

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

export const getStakes = (owner: string) =>
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
        break;
      }
      default: {
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
      }
    }

    if (transaction.fees && transaction.fees.gt(0)) {
      tx.setGasBudgetIfNotSet(BigInt(transaction.fees.toString() + "0")); // set max budget, doesn't mean that whole budget will be used for tx
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
      showEffects: true,
      showEvents: true,
    },
    limit: TRANSACTIONS_LIMIT_PER_QUERY,
  });
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
