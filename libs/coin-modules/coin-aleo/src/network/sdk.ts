import network from "@ledgerhq/live-network";
import { AleoDecryptedCiphertextResponse, AleoDecryptedRecordResponse } from "../types";

async function decryptRecord(
  ciphertext: string,
  viewKey: string,
): Promise<AleoDecryptedRecordResponse> {
  const res = await network<AleoDecryptedRecordResponse>({
    method: "POST",
    url: "https://aleo-backend.api.live.ledger.com/network/mainnet/decrypt",
    data: {
      ciphertext,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function decryptCiphertext({
  ciphertext,
  tpk,
  viewKey,
  programId,
  functionName,
  outputIndex,
}: {
  ciphertext: string;
  tpk: string;
  viewKey: string;
  programId: string;
  functionName: string;
  outputIndex: number;
}): Promise<AleoDecryptedCiphertextResponse> {
  const res = await network<AleoDecryptedCiphertextResponse>({
    method: "POST",
    url: "https://aleo-backend.api.live.ledger-test.com/network/mainnet/symmetric_decrypt",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      index: outputIndex,
      ciphertext: ciphertext,
      transition_public_key: tpk,
      view_key: viewKey,
      program: programId,
      function_name: functionName,
    },
  });

  return res.data;
}

export const sdkClient = {
  decryptRecord,
  decryptCiphertext,
};
