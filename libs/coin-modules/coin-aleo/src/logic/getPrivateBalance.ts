import BigNumber from "bignumber.js";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { PROGRAM_ID } from "../constants";
import { sdkClient } from "../network/sdk";
import type { AleoPrivateRecord, AleoUnspentRecord } from "../types";
import { parseMicrocredits } from "./utils";

export async function getPrivateBalance({
  currency,
  viewKey,
  privateRecords,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  privateRecords: AleoPrivateRecord[];
}): Promise<{
  balance: BigNumber;
  unspentRecords: AleoUnspentRecord[];
}> {
  let balance = new BigNumber(0);
  const unspentRecords: AleoUnspentRecord[] = [];
  const unspentCreditsRecords = privateRecords.filter(
    record => record.program_name === PROGRAM_ID.CREDITS && !record.spent,
  );

  await promiseAllBatched(2, unspentCreditsRecords, async record => {
    const decryptedRecord = await sdkClient.decryptRecord({
      currency,
      viewKey,
      ciphertext: record.record_ciphertext,
    });

    const microcredits = parseMicrocredits(decryptedRecord.data.microcredits);
    balance = balance.plus(microcredits);

    unspentRecords.push({
      ...record,
      microcredits,
      decryptedData: decryptedRecord,
    });
  });

  return {
    balance,
    unspentRecords,
  };
}
