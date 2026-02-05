import { createHash } from "crypto";
import invariant from "invariant";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoPrivateRecord } from "../types/api";
import type { AleoOperation, AleoTransactionType } from "../types";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { sdkClient } from "../network/sdk";
import { apiClient } from "../network/api";

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
  if (functionId === EXPLORER_TRANSFER_TYPES.PRIVATE) return "private";
  if (functionId === EXPLORER_TRANSFER_TYPES.PUBLIC) return "public";
  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) {
      return "private";
    } else if (functionId.endsWith("to_public")) {
      return "public";
    }
  } else if (operationType === "OUT") {
    if (functionId.startsWith(EXPLORER_TRANSFER_TYPES.PRIVATE)) {
      return "private";
    } else if (functionId.startsWith(EXPLORER_TRANSFER_TYPES.PUBLIC)) {
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
export const patchPublicOperations = async ({
  currency,
  publicOperations,
  privateRecords,
  address,
  ledgerAccountId,
  viewKey,
}: {
  currency: CryptoCurrency;
  publicOperations: AleoOperation[];
  privateRecords: AleoPrivateRecord[];
  address: string;
  ledgerAccountId: string;
  viewKey: string;
}): Promise<AleoOperation[]> => {
  const patchedOperations: AleoOperation[] = [];
  const fullyPublicOperations = publicOperations.filter(
    op =>
      op.extra.functionId !== EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC &&
      op.extra.functionId !== EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
  );

  const semiPublicOperations = publicOperations.filter(
    op =>
      op.extra.functionId === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC ||
      op.extra.functionId === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
  );

  for (const operation of semiPublicOperations) {
    // TRY TO FIND A MATCHING PRIVATE RECORD, IGNORE FEE_PRIVATE RECORDS
    const privateRecord = privateRecords.find(
      record =>
        record.transaction_id.trim() === operation.hash.trim() &&
        record.function_name !== "fee_private",
    );

    // IF PRIVATE RECORD EXISTS, PATCH THE OPERATION
    // OCCURRS IN 2 CASES ONLY:
    // 1. PUBLIC TO PRIVATE (CONVERT)
    // 2. PRIVATE TO PUBLIC (CONVERT)
    if (privateRecord) {
      // ORIGINAL OPERATION, WE ONLY PATCH SENDERS/RECIPIENTS
      // FOR SELF-TRANSFERS, THE ORIGINAL OPERATION CAN BE INCOMING OR OUTGOING,
      // DEPENDING ON WHICH TRANSITION WE SEE IN THE PUBLIC TRANSACTION
      patchedOperations.push({
        ...operation,
        senders: privateRecord.sender ? [privateRecord.sender] : operation.senders,
        recipients: [address],
      });

      // CLONED OPERATION FOR SELF TRANSFERS (CONVERSION BETWEEN PUBLIC/PRIVATE)
      patchedOperations.push({
        ...operation,
        id: encodeOperationId(
          ledgerAccountId,
          operation.hash,
          operation.type === "IN" ? "OUT" : "IN",
        ),
        type: operation.type === "IN" ? "OUT" : "IN",
        date: new Date(operation.date.getTime() + 1), // ensure unique date for sorting
        extra: {
          ...operation.extra,
          transactionType: operation.extra.transactionType === "private" ? "public" : "private",
        },
        senders: [address],
        recipients: [address],
      });
    } else {
      // IF NO MATCHING PRIVATE RECORD AND IT'S VISIBLE IN OUR PUBLIC TRANSACTIONS,
      // IT IS SEMI-TRANSPARENT TRANSFER FROM OUR OWN ACCOUNT TO ANOTHER ACCOUNT
      // OR FROM ANOTHER ACCOUNT TO OUR OWN ACCOUNT, WE CAN PATCH IT TO SHOW THE COUNTERPARTY ADDRESS

      const { execution } = await apiClient.getTransactionById(currency, operation.hash);
      const recordTransition = execution.transitions[0];

      // FOR PUBLIC TO PRIVATE (0 is address ciphertext, 1 is amount public)
      if (operation.extra.functionId === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE) {
        // AS SENDER WE ARE ABLE TO DECRYPT THE RECIPIENT ADDRESS
        // FIXME: WHY SOMETIMES IT FAILS ?
        try {
          const recipientData = await sdkClient.decryptCiphertext({
            ciphertext: recordTransition.inputs[0].value,
            tpk: recordTransition.tpk,
            viewKey,
            programId: PROGRAM_ID.CREDITS,
            functionName: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
            outputIndex: 0,
          });
          patchedOperations.push({
            ...operation,
            recipients: [recipientData.plaintext],
          });
        } catch {
          continue;
        }
      } else {
        // FOR PRIVATE TO PUBLIC (IN OPERATION)
        patchedOperations.push(operation);
      }
    }
  }

  patchedOperations.push(...fullyPublicOperations);

  return patchedOperations;
};

// Method to merge old and new records, mark spent/unspent based on unspent records list, and sort by block height desc
export function processRecords(
  oldRecords: AleoPrivateRecord[],
  newRecords: AleoPrivateRecord[],
  unspentRecords: AleoPrivateRecord[],
): AleoPrivateRecord[] {
  const existingKeys = new Set(oldRecords.map(r => `${r.transaction_id}_${r.commitment}`));

  return [
    ...oldRecords,
    ...newRecords.filter(r => !existingKeys.has(`${r.transaction_id}_${r.commitment}`)),
  ]
    .map(r => {
      const isUnspent = unspentRecords.some(u => u.commitment === r.commitment);

      return {
        ...r,
        transaction_id: r.transaction_id.trim(),
        transition_id: r.transition_id.trim(),
        spent: !isUnspent,
      };
    })
    .sort((a, b) => b.block_height - a.block_height);
}
