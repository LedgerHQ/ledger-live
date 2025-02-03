import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionData } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import type { Operation, OperationType } from "@ledgerhq/types-live";

// import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

type AsyncApiFunction = (api: SuiClient) => Promise<any>;

const rpcUrl = getFullnodeUrl("devnet");

let api: SuiClient | null = null;

const TRANSACTIONS_REQUEST_LIMIT = 100;

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
      // blockHeight,
      balance: BigNumber(balance.totalBalance),
      // additionalBalance: BigNumber(additionalBalance),
      // nonce,
    };
  });

/**
 * Returns true if account is the signer
 */
function isSender(transaction: TransactionData, addr: string): boolean {
  return transaction.sender === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(transaction: TransactionData, addr: string): OperationType {
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
// function getOperationValue(transaction: Transaction, addr: string): BigNumber {
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
 * Map the Sui history transaction to a Ledger Live Operation
 */
async function transactionToOperation(
  accountId: string,
  addr: string,
  transaction: Transaction,
): Promise<Operation> {
  const type = getOperationType(transaction.getData(), addr);
  const hash = await transaction.getDigest();

  return {
    id: encodeOperationId(accountId, hash, type),
    accountId,
    // fee: BigNumber(transaction.fees || 0),
    // value: getOperationValue(transaction, addr),
    type,
    // This is where you retrieve the hash of the transaction
    hash,
    blockHash: null,
    // blockHeight: transaction.blockNumber,
    // date: new Date(transaction.timestamp),
    // extra: getOperationExtra(transaction),
    // senders: [transaction.sender],
    // recipients: transaction.recipient ? [transaction.recipient] : [],
    // transactionSequenceNumber: isSender(transaction, addr) ? transaction.nonce : undefined,
    // hasFailed: !transaction.success,

    blockHeight: 0, // Required by Operation type
    date: new Date(), // Required by Operation type
    extra: {}, // Required by Operation type
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [addr],
    recipients: [],
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
): Promise<Operation[]> =>
  withApi(async api => {
    const senderTx = await api.queryTransactionBlocks({
      filter: { FromAddress: addr },
      options: {
        showInput: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
      limit: TRANSACTIONS_REQUEST_LIMIT,
    });
    const recipientTx = await api.queryTransactionBlocks({
      filter: { ToAddress: addr },
      options: {
        showInput: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
        showEffects: true, // To get transaction status and gas fee details
      },
      limit: TRANSACTIONS_REQUEST_LIMIT,
    });

    const rawTransactions = [...senderTx.data, ...recipientTx.data].sort(
      (a, b) => Number(b.timestampMs) - Number(a.timestampMs),
    );

    return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
  });

export const getPreloadedData = () => {};
