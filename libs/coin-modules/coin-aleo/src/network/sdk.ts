import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNetworkConfig } from "../logic/utils";
import type { AleoDecryptedCiphertextResponse } from "../types";
import type {
  AleoDecryptedRecordResponse,
  AleoEncryptedRegistrationResponse,
  PreparedRequestResponse,
  Intent,
  AuthorizationResponse,
  FeeConfiguration,
  EncryptProvingRequestResponse,
} from "../types/sdk";

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

async function createRequestFromIntent({
  currency,
  intent,
  feeConfiguration,
  viewKey,
}: {
  currency: CryptoCurrency;
  intent: Intent;
  feeConfiguration: FeeConfiguration | null;
  viewKey?: string;
}): Promise<PreparedRequestResponse> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<PreparedRequestResponse>({
    method: "POST",
    url: `${sdkUrl}/transactions/request`,
    data: {
      intent,
      fee: feeConfiguration,
      ...(viewKey && { view_key: viewKey }),
    },
  });

  return res.data;
}

async function createAuthorization({
  currency,
  request,
  signatures,
  viewKey,
}: {
  currency: CryptoCurrency;
  request: PreparedRequestResponse;
  signatures: string | string[];
  viewKey: string;
}) {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AuthorizationResponse>({
    method: "POST",
    url: `${sdkUrl}/transactions/authorization`,
    data: {
      request,
      signatures,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function encryptProvingRequest({
  currency,
  publicKey,
  authorization,
  feeAuthorization,
  broadcast,
}: {
  publicKey: string;
  currency: CryptoCurrency;
  authorization: Record<string, unknown>;
  feeAuthorization?: Record<string, unknown>;
  broadcast: boolean;
}): Promise<string> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<EncryptProvingRequestResponse>({
    method: "POST",
    url: `${sdkUrl}/encrypt_proving_request`,
    data: {
      public_key: publicKey,
      proving_request: {
        authorization,
        fee_authorization: feeAuthorization ?? null,
        broadcast,
      },
    },
  });

  return res.data.encrypted;
}

export const sdkClient = {
  encryptRegistrationPayload,
  decryptRecord,
  decryptCiphertext,
  createRequestFromIntent,
  createAuthorization,
  encryptProvingRequest,
};
