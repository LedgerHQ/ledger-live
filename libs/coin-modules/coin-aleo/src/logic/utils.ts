import { createHash } from "crypto";
import invariant from "invariant";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type { AleoPrivateRecord } from "../types/api";
import type { AleoOperation, AleoTransactionType } from "../types";
import { TRANSFERS } from "../constants";

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

/**
 * Patches public operations to handle semi transparent transactions (public_to_private and private_to_public).
 * For self-transfers involving private records, creates additional operations to show both sides of the transfer.
 *
 * @param publicOperations - List of public operations to check
 * @param privateRecords - List of owned private records
 * @param address - The account address
 * @param ledgerAccountId - The Ledger account ID
 * @returns Array of patched operations including additional operations for semi transparent transfers
 */
export const patchPublicOperations = async (
  publicOperations: AleoOperation[],
  privateRecords: AleoPrivateRecord[],
  address: string,
  ledgerAccountId: string,
): Promise<AleoOperation[]> => {
  const patchedOperations: AleoOperation[] = [];
  const fullyPublicOperations = publicOperations.filter(
    op =>
      op.extra.functionId !== TRANSFERS.PRIVATE_TO_PUBLIC &&
      op.extra.functionId !== TRANSFERS.PUBLIC_TO_PRIVATE,
  );
  const semiPublicOperations = publicOperations.filter(
    op =>
      op.extra.functionId === TRANSFERS.PRIVATE_TO_PUBLIC ||
      op.extra.functionId === TRANSFERS.PUBLIC_TO_PRIVATE,
  );

  if (fullyPublicOperations.length === publicOperations.length) return publicOperations;

  for (const operation of semiPublicOperations) {
    const privateRecord = privateRecords.find(
      record => record.transaction_id.trim() === operation.hash.trim(),
    );

    // IF PRIVATE RECORD EXISTS, PATCH THE OPERATION
    // OCCURRS IN 3 CASES:
    // 1. PRIVATE TO PUBLIC (WHEN WE SEND FROM OUR OWN PRIVATE ACCOUNT)
    // 2. PUBLIC TO PRIVATE (WHEN SOMEONE SENDS TO OUR PRIVATE ACCOUNT)
    // 3. SELF-TRANSFER (PRIVATE TO PUBLIC & BACK TO PRIVATE)
    if (privateRecord) {
      const selfTransfer = privateRecord.sender === address;

      // ORIGINAL OPERATION, WE ONLY PATCH SENDERS/RECIPIENTS
      // FOR SELF-TRANSFERS, THE ORIGINAL OPERATION CAN BE INCOMING OR OUTGOING,
      // DEPENDING ON WHICH TRANSITION WE SEE IN THE PUBLIC TRANSACTION
      patchedOperations.push({
        ...operation,
        senders: privateRecord.sender ? [privateRecord.sender] : operation.senders,
        recipients: selfTransfer ? [address] : operation.recipients,
      });

      if (selfTransfer) {
        // CLONED OPERATION FOR SELF TRANSFERS (CONVERSION BETWEEN PUBLIC/PRIVATE)
        patchedOperations.push({
          ...operation,
          id: encodeOperationId(
            ledgerAccountId,
            operation.hash,
            operation.type === "IN" ? "OUT" : "IN",
          ),
          type: operation.type === "IN" ? "OUT" : "IN",
          extra: {
            ...operation.extra,
            transactionType: operation.extra.transactionType === "private" ? "public" : "private",
          },
          senders: [address],
          recipients: [address],
        });
      }
    } else {
      // IF NO PRIVATE RECORD, JUST PUSH THE ORIGINAL OPERATION, IT CAN HAPPEN
      // IF THE TRANSFER COMES FROM ANOTHER PRIVATE ACCOUNT AND WE DON'T HAVE THE PRIVATE RECORD
      // TO CONFIRM IT'S A SELF-TRANSFER (E.G PRIVATE TO PUBLIC FROM ANOTHER ACCOUNT)
      patchedOperations.push(operation);
    }
  }

  return patchedOperations;
};
