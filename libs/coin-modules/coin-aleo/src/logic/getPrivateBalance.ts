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
  const unspentCreditsRecords = privateRecords.filter(
    record => record.program_name === PROGRAM_ID.CREDITS && !record.spent,
  );

  const decryptedResults = await promiseAllBatched(2, unspentCreditsRecords, async record => {
    const decryptedRecord = await sdkClient.decryptRecord({
      currency,
      viewKey,
      ciphertext: record.record_ciphertext,
    });
    const microcredits = parseMicrocredits(decryptedRecord.data.microcredits);

    return {
      microcredits,
      unspentRecord: {
        ...record,
        microcredits,
        decryptedData: decryptedRecord,
      },
    };
  });

  const balance = decryptedResults.reduce((acc, { microcredits }) => {
    return acc.plus(microcredits);
  }, new BigNumber(0));

  const unspentRecords: AleoUnspentRecord[] = decryptedResults.map(
    ({ unspentRecord }) => unspentRecord,
  );

  return {
    balance,
    unspentRecords,
  };
}
