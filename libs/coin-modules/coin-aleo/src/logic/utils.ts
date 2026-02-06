import { createHash } from "crypto";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoTransactionType, Transaction } from "../types";
import { TRANSFERS } from "../constants";
import aleoConfig from "../config";

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
