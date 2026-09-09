import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CasperOperation, Transaction } from "../../types";
import { TEST_ADDRESSES, TEST_TRANSACTION_HASHES, TEST_TRANSFER_IDS } from "./addresses.fixture";
import { createMockAccount } from "./account.fixture";
import { createMockTransaction } from "./transaction.fixture";

export const createMockOperation = (
  account: Account,
  transaction: Transaction,
  options?: Partial<Operation>,
): CasperOperation => {
  const hash = options?.hash || "0x" + Math.random().toString(16).substring(2, 10);
  const type = (options?.type as OperationType) || "OUT";

  const operation: CasperOperation = {
    id: options?.id || encodeOperationId(account.id, hash, type),
    hash,
    type,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    blockHash: options?.blockHash || null,
    blockHeight: options?.blockHeight || null,
    value: transaction.amount.plus(transaction.fees ?? new BigNumber(0)),
    fee: transaction.fees ?? new BigNumber(0),
    date: options?.date || new Date(),
    extra: {
      ...(transaction.transferId !== undefined && { transferId: transaction.transferId }),
    },
    nftOperations: [],
    subOperations: [],
  };

  return { ...operation, ...options } as CasperOperation;
};

export const createMockSignedOperation = (
  account: Account,
  transaction: Transaction,
  options?: {
    signature?: string;
    rawTxJson?: object;
    operationOptions?: Partial<Operation>;
  },
) => {
  const operation = createMockOperation(account, transaction, options?.operationOptions);

  return {
    signature: options?.signature || "deadbeef1234567890abcdef",
    operation,
    rawData: {
      tx: JSON.stringify(
        options?.rawTxJson || {
          hash: TEST_TRANSACTION_HASHES.VALID,
          header: {
            account: account.freshAddress,
            timestamp: new Date().getTime(),
          },
          payment: {
            target: transaction.recipient,
            amount: transaction.amount.toString(),
          },
          fee: (transaction.fees ?? new BigNumber(0)).toString(),
        },
      ),
    },
  };
};

export const createMockOperationSet = (account: Account): CasperOperation[] => {
  const standardTx = createMockTransaction({ amount: new BigNumber("1000000000") });
  const largeTx = createMockTransaction({ amount: new BigNumber("5000000000") });
  const smallTx = createMockTransaction({ amount: new BigNumber("100000000") });
  const transferIdTx = createMockTransaction({ transferId: TEST_TRANSFER_IDS.VALID });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return [
    createMockOperation(account, standardTx, { type: "OUT", hash: "0xoutoperation1", date: now }),
    createMockOperation(account, standardTx, {
      type: "IN",
      hash: "0xinoperation1",
      date: yesterday,
      senders: [TEST_ADDRESSES.RECIPIENT_SECP256K1],
    }),
    createMockOperation(account, largeTx, { type: "OUT", hash: "0xoutlarge1", date: lastWeek }),
    createMockOperation(account, smallTx, { type: "OUT", hash: "0xoutsmall1", date: lastMonth }),
    createMockOperation(account, transferIdTx, {
      type: "OUT",
      hash: "0xtransferid1",
      date: lastMonth,
    }),
    createMockOperation(account, standardTx, {
      type: "OUT",
      hash: "0xwithblock1",
      blockHeight: 12345,
      blockHash: "0xblockhash123",
      date: lastMonth,
    }),
  ];
};

export const createMockAccountSet = (): Account[] => {
  return [
    createMockAccount(),
    createMockAccount({ balance: new BigNumber("0"), spendableBalance: new BigNumber("0") }),
    createMockAccount({
      pendingOperations: [
        createMockOperation(
          createMockAccount(),
          createMockTransaction({ amount: new BigNumber("500000000") }),
          { type: "OUT", id: "pending-op-1" },
        ),
      ],
    }),
    createMockAccount({
      balance: new BigNumber("100000000000000"),
      spendableBalance: new BigNumber("100000000000000"),
    }),
  ];
};
