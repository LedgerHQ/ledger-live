import {
  getFullnodeUrl,
  PaginatedTransactionResponse,
  QueryTransactionBlocksParams,
  SuiClient,
} from "@mysten/sui/client";
// import { Transaction, TransactionData } from "@mysten/sui/transactions";
import { TransactionBlockData, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";

// import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

import { makeLRUCache, minutes, hours } from "@ledgerhq/live-network/cache";

type AsyncApiFunction = (api: SuiClient) => Promise<any>;

const rpcUrl = getFullnodeUrl("devnet");

let api: SuiClient | null = null;

const TRANSACTIONS_REQUEST_LIMIT = 100;

const BLOCK_HEIGHT = 5; // sui has no block height metainfo, we use it simulate proper icon statuses in apps

// tx.getData().

/**
 * Connects to Sui Api
 */
async function withApi(execute: AsyncApiFunction): Promise<any> {
  // If client is instanciated already, ensure it is connected & ready
  // if (api) {
  //   try {
  //     await api.isReady;
  //   } catch (err) {
  //     api = null;
  //   }
  // }

  if (!api) {
    api = new SuiClient({ url: rpcUrl });
  }

  try {
    const res = await execute(api);

    return res;
  } catch {
    // Handle Error or Retry
    // await disconnect();
  }
}

/**
 * Disconnects Sui Api
 */
// export const disconnect = async () => {
//   if (api) {
//     const disconnecting = api;
//     api = null;
//     await disconnecting.close();
//   }
// };

/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string) =>
  withApi(async api => {
    const [balance] = await Promise.all([api.getBalance({ owner: addr })]);
    return {
      blockHeight: BLOCK_HEIGHT * 2,
      balance: BigNumber(balance.totalBalance),
      // additionalBalance: BigNumber(additionalBalance),
      // nonce,
    };
  });

/**
 * Returns true if account is the signer
 */
function isSender(addr: string, transaction?: TransactionBlockData): boolean {
  const prefix = addr.startsWith("0x") ? "" : "0x";
  return transaction?.sender === prefix + addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(addr: string, transaction?: TransactionBlockData): OperationType {
  return isSender(addr, transaction) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
// function getOperationAmount(transaction: Transaction, addr: string): BigNumber {
//   return isSender(transaction, addr)
//     ? BigNumber(transaction.value).plus(transaction.fees)
//     : BigNumber(transaction.value);
// }

/**
 * Extract extra from transaction if any
 */
// function getOperationExtra(transaction: Transaction): Record<string, any> {
//   return {
//     additionalField: transaction.additionalField,
//   };
// }

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
    blockHeight: BLOCK_HEIGHT, // Required by Operation type
    date: getOperationDate(transaction), // Required by Operation type
    extra: {}, // Required by Operation type
    fee: getOperationFee(transaction),
    hasFailed: transaction.effects?.status.status != "success",
    hash,
    recipients: getOperationRecipients(transaction.transaction?.data),
    senders: getOperationSenders(transaction.transaction?.data),
    // transactionSequenceNumber: isSender(transaction, address) ? transaction.nonce : undefined,
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

export const paymentInfo = makeLRUCache(
  signedTx => signedTx, // TODO: implement
  signedTx => signedTx,
  minutes(5),
);

export const submitExtrinsic = async (extrinsic: string) => extrinsic; // TODO: implement

export const getRegistry = makeLRUCache(
  () =>
    new Promise(resolve => {
      resolve({
        // TODO: implement
        createType: () => ({
          addSignature: () => "",
          toHex: () => "",
        }),
      });
    }),
  () => "sui",
  hours(1),
);

export const createTransaction = (address: string) => {
  const tx = new Transaction();
  tx.setSenderIfNotSet(address);
  console.log("createTransaction tx", tx);
  return tx;
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
