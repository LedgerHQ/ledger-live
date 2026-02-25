import invariant from "invariant";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import aleoConfig from "../config";
import { EXPLORER_TRANSFER_TYPES } from "../constants";
import type { AleoTransactionType } from "../types";

export function parseMicrocredits(microcreditsU64: string): string {
  const value = microcreditsU64.split(".")[0];
  const expectedSuffix = "u64";
  const hasValidSuffix = value.endsWith(expectedSuffix);
  invariant(hasValidSuffix, `aleo: invalid microcredits format (${microcreditsU64})`);
  return value.replace(expectedSuffix, "");
}

export function getNetworkConfig(currency: CryptoCurrency) {
  const config = aleoConfig.getCoinConfig(currency);

  return {
    nodeUrl: config.apiUrls.node,
    sdkUrl: config.apiUrls.sdk,
    networkType: config.networkType,
  };
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
  if (functionId === EXPLORER_TRANSFER_TYPES.PRIVATE) return "private";
  if (functionId === EXPLORER_TRANSFER_TYPES.PUBLIC) return "public";

  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) return "private";
    if (functionId.endsWith("to_public")) return "public";
  }

  if (operationType === "OUT") {
    if (functionId.startsWith("transfer_private")) return "private";
    if (functionId.startsWith("transfer_public")) return "public";
  }

  return "public";
};
