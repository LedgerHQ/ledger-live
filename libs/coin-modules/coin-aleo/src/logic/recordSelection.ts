import BigNumber from "bignumber.js";
import invariant from "invariant";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  PROGRAM_ID,
  TRANSACTION_TYPE,
} from "../constants";
import { decryptRecordAmount, fetchAllOwnedRecords } from "../network/utils";
import type {
  AleoApiPrivateIntentData,
  AleoApiTransactionIntent,
  AleoCoinConfig,
  AleoContext,
  AleoDecryptedRecordResponse,
  AleoPrivateRecord,
  AleoTransactionIntent,
  AleoUnspentRecord,
} from "../types";
import {
  findBestRecordForFee,
  isTokenRecord,
  resolvePrivacyContext,
  selectPrivateRecordsForAmount,
} from "./utils";

function getPrivateIntentData(txIntent: AleoApiTransactionIntent): AleoApiPrivateIntentData {
  invariant("data" in txIntent, `aleo: intent data is required for ${txIntent.type}`);
  const { data } = txIntent;

  switch (data.type) {
    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC:
      return data;
    default:
      throw new Error(`aleo: ${txIntent.type} does not spend private records`);
  }
}

async function fetchUnspentRecords(
  config: AleoCoinConfig,
  provableId: string,
  programId: string,
): Promise<AleoPrivateRecord[]> {
  const records = await fetchAllOwnedRecords({
    config,
    uuid: provableId,
    unspent: true,
    programs: [programId],
    functions: [],
  });

  return records.filter(
    record =>
      record.program_name === programId &&
      (programId === PROGRAM_ID.CREDITS || isTokenRecord(record)),
  );
}

function decryptRecords(
  config: AleoCoinConfig,
  viewKey: string,
  records: AleoPrivateRecord[],
): Promise<AleoUnspentRecord[]> {
  return promiseAllBatched(4, records, async record => {
    const { amount, details } = await decryptRecordAmount(config, viewKey, record);
    return { ...record, microcredits: amount.toFixed(0), decryptedData: details };
  });
}

async function fetchRecordsByCommitment({
  config,
  context,
  programId,
  commitments,
}: {
  config: AleoCoinConfig;
  context: AleoContext;
  programId: string;
  commitments: string[];
}): Promise<AleoDecryptedRecordResponse[]> {
  invariant(new Set(commitments).size === commitments.length, "aleo: duplicate record commitments");
  const { provableId, viewKey } = resolvePrivacyContext(context);

  const unspentRecords = await fetchUnspentRecords(config, provableId, programId);
  const recordByCommitment = new Map(unspentRecords.map(record => [record.commitment, record]));
  const missingCommitments = commitments.filter(commitment => !recordByCommitment.has(commitment));
  invariant(
    missingCommitments.length === 0,
    `aleo: records are no longer unspent: ${missingCommitments.join(", ")}`,
  );

  const records = await decryptRecords(
    config,
    viewKey,
    commitments.flatMap(commitment => recordByCommitment.get(commitment) ?? []),
  );

  return records.map(record => record.decryptedData);
}

/**
 * Picks the amount records of a private root intent and, unless fees are sponsored (`fee` is
 * `null`), the fee record — the same selection the bridge makes in `prepareTransaction`.
 */
export async function selectRecords({
  config,
  context,
  txIntent,
  fee,
}: {
  config: AleoCoinConfig;
  context: AleoContext;
  txIntent: AleoApiTransactionIntent;
  fee: bigint | null;
}): Promise<{ recordCommitments: string[]; feeRecordCommitment?: string }> {
  const { provableId, viewKey } = resolvePrivacyContext(context);
  const data = getPrivateIntentData(txIntent);
  const isToken = "programId" in data;
  const programId = isToken ? data.programId : PROGRAM_ID.CREDITS;

  const amountPool = await decryptRecords(
    config,
    viewKey,
    await fetchUnspentRecords(config, provableId, programId),
  );
  const amountRecords = selectPrivateRecordsForAmount({
    unspentRecords: amountPool,
    targetAmount: new BigNumber(txIntent.amount.toString()),
    maxRecords: isToken
      ? MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION
      : MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  });
  invariant(amountRecords.length > 0, "aleo: not enough private records to cover the amount");
  const recordCommitments = amountRecords.map(record => record.commitment);

  if (fee === null) {
    return { recordCommitments };
  }

  const feePool = isToken
    ? await decryptRecords(
        config,
        viewKey,
        await fetchUnspentRecords(config, provableId, PROGRAM_ID.CREDITS),
      )
    : amountPool;
  const feeRecord = findBestRecordForFee({
    unspentRecords: feePool,
    targetFee: new BigNumber(fee.toString()),
    selectedAmountRecordCommitments: recordCommitments,
  });
  invariant(feeRecord, "aleo: no private record left to cover the fee");

  return { recordCommitments, feeRecordCommitment: feeRecord.commitment };
}

/**
 * Turns an API intent into the intent the logic crafts: record commitments are resolved against
 * the current unspent records and decrypted. Intents without records pass through unchanged.
 */
export async function resolveRecords({
  config,
  context,
  txIntent,
}: {
  config: AleoCoinConfig;
  context: AleoContext;
  txIntent: AleoApiTransactionIntent;
}): Promise<AleoTransactionIntent> {
  if (!("data" in txIntent)) {
    return txIntent;
  }
  const { data } = txIntent;

  switch (data.type) {
    case "fee_private": {
      const [record] = await fetchRecordsByCommitment({
        config,
        context,
        programId: PROGRAM_ID.CREDITS,
        commitments: [data.recordCommitment],
      });

      return {
        ...txIntent,
        data: {
          type: data.type,
          executionId: data.executionId,
          ...(data.priorityFee !== undefined && { priorityFee: data.priorityFee }),
          record,
        },
      };
    }
    case TRANSACTION_TYPE.TRANSFER_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC:
    case TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE:
    case TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC: {
      const commitments = data.recordCommitments ?? [];
      const tvks = data.tvks ?? [];
      invariant(commitments.length > 0, `aleo: record commitments are required for ${data.type}`);

      // One TVK per transition: the root plus one per nested call, none for a single record.
      const expectedTvks = commitments.length > 1 ? commitments.length + 1 : 0;
      invariant(
        tvks.length === expectedTvks,
        `aleo: expected ${expectedTvks} tvks for ${commitments.length} record(s), received ${tvks.length}`,
      );

      const isToken = "programId" in data;
      const records = await fetchRecordsByCommitment({
        config,
        context,
        programId: isToken ? data.programId : PROGRAM_ID.CREDITS,
        commitments,
      });

      return {
        ...txIntent,
        data: isToken
          ? { type: data.type, programId: data.programId, records, tvks }
          : { type: data.type, records, tvks },
      };
    }
    default:
      return { ...txIntent, data };
  }
}
