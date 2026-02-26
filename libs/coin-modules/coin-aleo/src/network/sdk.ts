import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNetworkConfig } from "../logic/utils";
import type { AleoDecryptedRecordResponse, AleoEncryptedRegistrationResponse } from "../types/sdk";
import type { AleoDecryptedCiphertextResponse } from "../types";

async function encryptRegistrationPayload({
  currency,
  publicKey,
  viewKey,
  start,
}: {
  currency: CryptoCurrency;
  publicKey: string;
  viewKey: string;
  start: number;
}): Promise<AleoEncryptedRegistrationResponse> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AleoEncryptedRegistrationResponse>({
    method: "POST",
    url: `${sdkUrl}/encrypt_registration`,
    data: {
      public_key: publicKey,
      view_key: viewKey,
      start,
    },
  });

  return res.data;
}

async function decryptRecord({
  currency,
  ciphertext,
  viewKey,
}: {
  currency: CryptoCurrency;
  ciphertext: string;
  viewKey: string;
}): Promise<AleoDecryptedRecordResponse> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AleoDecryptedRecordResponse>({
    method: "POST",
    url: `${sdkUrl}/decrypt`,
    data: {
      ciphertext,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function decryptCiphertext({
  currency,
  ciphertext,
  tpk,
  viewKey,
  programId,
  functionName,
  outputIndex,
}: {
  currency: CryptoCurrency;
  ciphertext: string;
  tpk: string;
  viewKey: string;
  programId: string;
  functionName: string;
  outputIndex: number;
}): Promise<AleoDecryptedCiphertextResponse> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AleoDecryptedCiphertextResponse>({
    method: "POST",
    url: `${sdkUrl}/symmetric_decrypt`,
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
  encryptRegistrationPayload,
  decryptRecord,
  decryptCiphertext,
};
