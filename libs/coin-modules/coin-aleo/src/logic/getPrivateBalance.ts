import BigNumber from "bignumber.js";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { AleoPrivateRecord } from "../types/api";
import { sdkClient } from "../network/sdk";
import { parseMicrocredits } from "./utils";

export async function getPrivateBalance({
  viewKey,
  privateRecords,
}: {
  viewKey: string;
  privateRecords: AleoPrivateRecord[];
}): Promise<BigNumber> {
  const unspentRecords = privateRecords.filter(record => !record.spent);
  let balance = new BigNumber(0);

  await promiseAllBatched(2, unspentRecords, async record => {
    const decryptedRecord = await sdkClient.decryptRecord(record.record_ciphertext, viewKey);
    const microcreditsU64 = decryptedRecord.data.microcredits.split(".")[0];
    const microcredits = parseMicrocredits(microcreditsU64);

    balance = balance.plus(microcredits);
  });

  return balance;
}
