import { createHash } from "crypto";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  AleoAccount,
  AleoTransactionType,
  AleoUnspentRecord,
  Transaction,
  TransactionSelfTransfer,
  TransactionTransfer,
} from "../types";
import { TRANSACTION_TYPE, TRANSFERS } from "../constants";
import aleoConfig from "../config";
import { Intent } from "../types/sdk";

export function getNetworkConfig(currency: CryptoCurrency) {
  const config = aleoConfig.getCoinConfig(currency);

  return {
    nodeUrl: config.apiUrls.node,
    sdkUrl: config.apiUrls.sdk,
    networkType: config.networkType,
  };
}

export function parseMicrocredits(microcreditsU64: string): string {
  const value = microcreditsU64.split(".")[0];
  const expectedSuffix = "u64";
  const hasValidSuffix = value.endsWith(expectedSuffix);
  invariant(hasValidSuffix, `aleo: invalid microcredits format (${microcreditsU64})`);

  return value.replace(expectedSuffix, "");
}

export function patchAccountWithViewKey(account: Account, viewKey: string): Account {
  invariant(viewKey, `aleo: viewKey is missing in patchAccountWithViewKey ${account.freshAddress}`);
  const accountIdParams = decodeAccountId(account.id);
  const updatedAccountId = encodeAccountId({
    ...accountIdParams,
    customData: viewKey,
  });

  const updateOperations = (ops: Operation[]) =>
    ops.map(op => {
      const { hash, type } = decodeOperationId(op.id);
      const updatedOperationId = encodeOperationId(updatedAccountId, hash, type);

      return {
        ...op,
        id: updatedOperationId,
        accountId: updatedAccountId,
      };
    });

  return {
    ...account,
    id: updatedAccountId,
    operations: updateOperations(account.operations),
    pendingOperations: updateOperations(account.pendingOperations),
  };
}

export const determineTransactionType = (
  functionId: string,
  operationType: OperationType,
): AleoTransactionType => {
  if (functionId === TRANSFERS.PRIVATE) return "private";
  if (functionId === TRANSFERS.PUBLIC) return "public";
  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) {
      return "private";
    } else if (functionId.endsWith("to_public")) {
      return "public";
    }
  } else if (operationType === "OUT") {
    if (functionId.startsWith(TRANSFERS.PRIVATE)) {
      return "private";
    } else if (functionId.startsWith(TRANSFERS.PUBLIC)) {
      return "public";
    }
  }

  if (operationType === "OUT") {
    return functionId.startsWith("transfer_private") ? "private" : "public";
  }

  return "public";
};

export const generateUniqueUsername = (address: string): string => {
  const timestamp = new Date().getTime().toString();
  const combined = `${timestamp}_${address}`;
  const hash = createHash("sha256").update(combined).digest("hex");
  return hash;
};

export function calculateAmount({
  account,
  transaction,
  estimatedFees,
}: {
  account: Account;
  transaction: Transaction;
  estimatedFees: BigNumber;
}) {
  let amount = transaction.amount;

  if (transaction.useAllAmount) {
    amount = BigNumber.max(0, account.balance.minus(estimatedFees));
  }

  const totalSpent = amount.plus(estimatedFees);

  return {
    amount,
    totalSpent,
  };
}

export interface SignedAleoTransaction {
  authorization: Record<string, unknown>;
  feeAuthorization: Record<string, unknown>;
}

export function serializeTransaction(tx: SignedAleoTransaction): string {
  return Buffer.from(JSON.stringify(tx)).toString("hex");
}

export function deserializeTransaction(serialized: string): SignedAleoTransaction {
  return JSON.parse(Buffer.from(serialized, "hex").toString("utf8"));
}

export function getViewKey(account: AleoAccount): string {
  const viewKey = decodeAccountId(account.id).customData;
  invariant(viewKey, `aleo: viewKey is missing in account ${account.id}`);
  return viewKey;
}

export function mapTransactionToIntent(transaction: Transaction): Intent {
  switch (transaction.type) {
    case TRANSACTION_TYPE.TRANSFER_PUBLIC: {
      return {
        type: "transfer_public",
        amount: transaction.amount.toString(),
        to: transaction.recipient,
      };
    }
    case TRANSACTION_TYPE.TRANSFER_PRIVATE: {
      invariant(transaction.amountRecord, "aleo: amount record is missing");
      return {
        type: "transfer_private",
        amount: transaction.amount.toString(),
        to: transaction.recipient,
        record: transaction.amountRecord,
      };
    }
    case TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE: {
      return {
        type: "transfer_public_to_private",
        amount: transaction.amount.toString(),
        to: transaction.recipient,
      };
    }
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC: {
      invariant(transaction.amountRecord, "aleo: amount record is missing");
      return {
        type: "transfer_private_to_public",
        amount: transaction.amount.toString(),
        to: transaction.recipient,
        record: transaction.amountRecord,
      };
    }
    default:
      // @ts-expect-error FIXME:
      throw new Error(`aleo: unsupported transaction type in craftTransaction ${transaction.type}`);
  }
}

export function createFeeIntent({
  transaction,
  baseFee,
  executionId,
  priorityFee = 0n,
}: {
  transaction: Transaction;
  executionId: string;
  baseFee: bigint;
  priorityFee?: bigint;
}): Intent {
  if (
    transaction.type === TRANSACTION_TYPE.TRANSFER_PRIVATE ||
    transaction.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  ) {
    invariant(transaction.feeRecord, "aleo: fee record is missing");
    return {
      type: "fee_private",
      base_fee: baseFee.toString(),
      priority_fee: priorityFee.toString(),
      execution_id: executionId,
      record: transaction.feeRecord,
    };
  }

  return {
    type: "fee_public",
    base_fee: baseFee.toString(),
    priority_fee: priorityFee.toString(),
    execution_id: executionId,
  };
}

export function isSelfTransferTransaction(
  transaction: Transaction,
): transaction is TransactionSelfTransfer {
  return (
    transaction.type === TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE ||
    transaction.type === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
  );
}

export function isTransferTransaction(
  transaction: Transaction,
): transaction is TransactionTransfer {
  return (
    transaction.type === TRANSACTION_TYPE.TRANSFER_PUBLIC ||
    transaction.type === TRANSACTION_TYPE.TRANSFER_PRIVATE
  );
}

export function findBestRecords({
  unspentRecords,
  targetAmount,
  targetFee,
}: {
  unspentRecords: AleoUnspentRecord[];
  targetAmount: BigNumber;
  targetFee: BigNumber;
}): {
  amountRecord: AleoUnspentRecord | null;
  feeRecord: AleoUnspentRecord | null;
} {
  let amountRecord: AleoUnspentRecord | null = null;
  let feeRecord: AleoUnspentRecord | null = null;

  if (unspentRecords.length < 2) {
    return {
      amountRecord,
      feeRecord,
    };
  }

  // filter records that can cover the target amount
  const recordsSufficientForAmount = unspentRecords.filter(r =>
    new BigNumber(r.microcredits).gte(targetAmount),
  );

  if (recordsSufficientForAmount.length === 0) {
    return {
      amountRecord,
      feeRecord,
    };
  }

  // find the smallest record that can cover the target amount
  amountRecord = recordsSufficientForAmount.reduce((min, current) =>
    new BigNumber(current.microcredits).lt(new BigNumber(min.microcredits)) ? current : min,
  );

  // filter records that can cover the fee (must be different from amountRecord)
  const recordsSufficientForFee = unspentRecords.filter(
    r => r.commitment !== amountRecord.commitment && new BigNumber(r.microcredits).gte(targetFee),
  );

  if (recordsSufficientForFee.length === 0) {
    return {
      amountRecord,
      feeRecord,
    };
  }

  // find the smallest record that can cover the fee
  feeRecord = recordsSufficientForFee.reduce((min, current) =>
    new BigNumber(current.microcredits).lt(new BigNumber(min.microcredits)) ? current : min,
  );

  return {
    amountRecord,
    feeRecord,
  };
}
