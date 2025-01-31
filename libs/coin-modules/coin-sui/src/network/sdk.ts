import {
  getFullnodeUrl,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  SuiClient,
  ExecuteTransactionBlockParams,
  TransactionEffects,
} from "@mysten/sui/client";
import { TransactionBlockData, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";

import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";

type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;
// type ApiFunction<T> = (api: SuiClient) => T;

const rpcUrl = getFullnodeUrl("devnet");

let api: SuiClient | null = null;

const TRANSACTIONS_REQUEST_LIMIT = 100;

const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

/**
 * Connects to Sui Api
 */
async function withApi<T>(execute: AsyncApiFunction<T>) {
  if (!api) {
    api = new SuiClient({ url: rpcUrl });
  }

  const result = await execute(api);
  return result;
}

/**
 * Get account balance
 */
export const getAccount = async (addr: string) =>
  withApi(async api => {
    const [balance] = await Promise.all([api.getBalance({ owner: addr })]);
    return {
      blockHeight: BLOCK_HEIGHT * 2,
      nonce: 0,
      balance: BigNumber(balance.totalBalance),
    };
  });

/**
 * Returns true if account is the signer
 * TODO: move to utils
 */
function ensureAddressFormat(addr: string): `0x${string}` {
  return (addr.startsWith("0x") ? addr : `0x${addr}`) as `0x${string}`;
}

/**
 * Returns true if account is the signer
 */
function isSender(addr: string, transaction?: TransactionBlockData): boolean {
  return transaction?.sender === ensureAddressFormat(addr);
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(addr: string, transaction?: TransactionBlockData): OperationType {
  return isSender(addr, transaction) ? "OUT" : "IN";
}

/**
 * Extract senders from transaction
 */
const getOperationSenders = (transaction?: TransactionBlockData): string[] => {
  return transaction?.sender ? [transaction?.sender] : [];
};

/**
 * Extract recipients from transaction
 */
const getOperationRecipients = (transaction?: TransactionBlockData): string[] => {
  if (transaction?.transaction.kind === "ProgrammableTransaction") {
    if (!transaction?.transaction?.inputs) return [];
    const recipients: string[] = [];
    transaction.transaction.inputs.map(({ valueType, value }: any) => {
      if (valueType === "address") {
        recipients.push(value);
      }
    });
    return recipients;
  }
  return [];
};

/**
 * Extract value from transaction
 */
const getOperationAmount = (
  address: string,
  transaction: SuiTransactionBlockResponse,
): BigNumber => {
  let amount = new BigNumber(0);
  if (!transaction?.balanceChanges) return amount;
  for (const balanceChange of transaction.balanceChanges) {
    // @ts-expect-error TODO:fix
    if (balanceChange.owner.AddressOwner === address) {
      amount = amount.plus(balanceChange.amount);
    }
  }
  return amount;
};

/**
 * Extract fee from transaction
 */
const getOperationFee = (transaction: any): BigNumber => {
  return BigNumber(transaction.effects.gasUsed.computationCost).plus(
    BigNumber(transaction.effects.gasUsed.nonRefundableStorageFee),
  );
};

/**
 * Extract date from transaction
 */
const getOperationDate = (transaction: any): Date => {
  return new Date(parseInt(transaction.timestampMs));
};

/**
 * Map the Sui history transaction to a Ledger Live Operation
 */
function transactionToOperation(
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

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  inCursor?: string | null | undefined,
  outCursor?: string | null | undefined,
): Promise<Operation[]> =>
  withApi(async api => {
    const sentOps = await loadOperation({ api, type: "OUT", addr, cursor: outCursor });
    const receivedOps = await loadOperation({ api, type: "IN", addr, cursor: inCursor });
    const rawTransactions = [...sentOps, ...receivedOps].sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs),
    );

    return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
  });

export const getPreloadedData = () => ({
  // Add any preloaded data fields here
  networkInfo: {},
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

export const paymentInfo = async (sender: string, fakeTransaction: any) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(sender));
    const [coin] = tx.splitCoins(tx.gas, [fakeTransaction.amount.toNumber()]);
    tx.transferObjects([coin], fakeTransaction.recipient);
    const txb = await tx.build({ client: api });
    const dryRunTxResponse = await api.dryRunTransactionBlock({ transactionBlock: txb });
    const fees = getTotalGasUsed(dryRunTxResponse.effects);
    return {
      gasBudget: dryRunTxResponse.input.gasData.budget,
      totalGasUsed: fees,
      fees,
    };
  });

export const submitExtrinsic = async (extrinsic: string) => extrinsic; // TODO: implement

export const createTransaction = async (address: string, transaction: any) =>
  withApi(async api => {
    const tx = new Transaction();
    tx.setSender(ensureAddressFormat(address));

    const [coin] = tx.splitCoins(tx.gas, [transaction.amount.toNumber()]);
    tx.transferObjects([coin], transaction.recipient);

    return tx.build({ client: api });
  });

export const executeTransactionBlock = async (params: ExecuteTransactionBlockParams) => {
  return api?.executeTransactionBlock(params);
};

// load from curos point or from begining until we reach the end
const loadOperation = async (params: {
  api: SuiClient;
  type: OperationType;
  addr: string;
  cursor?: string | null | undefined;
}): Promise<PaginatedTransactionResponse["data"]> => {
  const { api, addr, type, cursor } = params;
  const filter: QueryTransactionBlocksParams["filter"] =
    type === "IN" ? { ToAddress: addr } : { FromAddress: addr };

  const { data, nextCursor, hasNextPage } = await api.queryTransactionBlocks({
    filter,
    cursor,
    order: "ascending",
    options: {
      showInput: true,
      showEffects: true, // To get transaction status and gas fee details
    },
    limit: TRANSACTIONS_REQUEST_LIMIT,
  });

  if (hasNextPage) {
    const newData = await loadOperation({ api, type, addr, cursor: nextCursor });
    return [...newData, ...data];
  }

  return data;
};
