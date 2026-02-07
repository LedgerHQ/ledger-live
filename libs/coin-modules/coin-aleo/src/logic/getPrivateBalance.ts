import BigNumber from "bignumber.js";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AleoPrivateRecord } from "../types/api";
import { sdkClient } from "../network/sdk";
import { AleoUnspentRecord } from "../types";
import { parseMicrocredits } from "./utils";

export async function getPrivateBalance({
  currency,
  viewKey,
  privateRecords,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  privateRecords: AleoPrivateRecord[];
}): Promise<{ balance: BigNumber; unspentRecords: AleoUnspentRecord[] }> {
  const unspentRecords = privateRecords.filter(record => !record.spent);
  const unspentRecordsWithPlaintext: AleoUnspentRecord[] = [];
  let balance = new BigNumber(0);

  await promiseAllBatched(2, unspentRecords, async record => {
    const decryptedRecord = await sdkClient.decryptRecord({
      currency,
      ciphertext: record.record_ciphertext,
      viewKey,
    });
    const microcredits = parseMicrocredits(decryptedRecord.data.microcredits);

    balance = balance.plus(microcredits);

    unspentRecordsWithPlaintext.push({
      ...record,
      microcredits,
      // FIXME: should come either from backend or dedicated util for formatting decrypted record
      plaintext: `{ owner: ${decryptedRecord.owner}, microcredits: ${decryptedRecord.data.microcredits}, _nonce: ${decryptedRecord.nonce}.public, _version: ${decryptedRecord.version}u8.public }`,
    });
  });

  return {
    balance,
    unspentRecords: unspentRecordsWithPlaintext,
  };
}
