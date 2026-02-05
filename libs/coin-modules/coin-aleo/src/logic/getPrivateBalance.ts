import BigNumber from "bignumber.js";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { AleoPrivateRecord } from "../types/api";
import { sdkClient } from "../network/sdk";
import { AleoUnspentRecord } from "../types";
import { parseMicrocredits } from "./utils";

export async function getPrivateBalance({
  viewKey,
  privateRecords,
}: {
  viewKey: string;
  privateRecords: AleoPrivateRecord[];
}): Promise<{ balance: BigNumber; unspentRecords: AleoUnspentRecord[] }> {
  const unspentRecords = privateRecords.filter(record => !record.spent);
  const unspentRecordsWithPlaintext: AleoUnspentRecord[] = [];
  let balance = new BigNumber(0);

  await promiseAllBatched(2, unspentRecords, async record => {
    const decryptedRecord = await sdkClient.decryptRecord(record.record_ciphertext, viewKey);
    const microcredits = parseMicrocredits(decryptedRecord.data.microcredits);

    balance = balance.plus(microcredits);

    unspentRecordsWithPlaintext.push({
      ...record,
      microcredits,
      plaintext: JSON.stringify(decryptedRecord),
    });
  });

  return {
    balance,
    unspentRecords: unspentRecordsWithPlaintext,
  };
}
