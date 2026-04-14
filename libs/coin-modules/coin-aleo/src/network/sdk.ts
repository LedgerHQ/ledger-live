import network from "@ledgerhq/live-network";
import { resolveConfig } from "../logic/utils";
import type { AleoCoinConfig, AleoDecryptedCiphertextResponse } from "../types";
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
  configOrCurrencyId,
  publicKey,
  viewKey,
  start,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  publicKey: string;
  viewKey: string;
  start: number;
}): Promise<AleoEncryptedRegistrationResponse> {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoEncryptedRegistrationResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/encrypt_registration`,
    data: {
      public_key: publicKey,
      view_key: viewKey,
      start,
    },
  });

  return res.data;
}

async function decryptRecord({
  configOrCurrencyId,
  ciphertext,
  viewKey,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  ciphertext: string;
  viewKey: string;
}): Promise<AleoDecryptedRecordResponse> {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoDecryptedRecordResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/decrypt`,
    data: {
      ciphertext,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function decryptCiphertext({
  configOrCurrencyId,
  ciphertext,
  tpk,
  viewKey,
  programId,
  functionName,
  outputIndex,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  ciphertext: string;
  tpk: string;
  viewKey: string;
  programId: string;
  functionName: string;
  outputIndex: number;
}): Promise<AleoDecryptedCiphertextResponse> {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoDecryptedCiphertextResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/symmetric_decrypt`,
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
  configOrCurrencyId,
  intent,
  feeConfiguration,
  viewKey,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  intent: Intent;
  feeConfiguration: FeeConfiguration | null;
  viewKey?: string;
}): Promise<PreparedRequestResponse> {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<PreparedRequestResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/transactions/request`,
    data: {
      intent,
      fee: feeConfiguration,
      ...(viewKey && { view_key: viewKey }),
    },
  });

  return res.data;
}

async function createAuthorization({
  configOrCurrencyId,
  request,
  signatures,
  viewKey,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  request: PreparedRequestResponse;
  signatures: string;
  viewKey: string;
}) {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<AuthorizationResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/transactions/authorization`,
    data: {
      request,
      signatures,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function encryptProvingRequest({
  configOrCurrencyId,
  publicKey,
  authorization,
  feeAuthorization,
  broadcast,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  publicKey: string;
  authorization: Record<string, unknown>;
  feeAuthorization?: Record<string, unknown>;
  broadcast: boolean;
}): Promise<string> {
  const { apiUrls } = resolveConfig(configOrCurrencyId);

  const res = await network<EncryptProvingRequestResponse>({
    method: "POST",
    url: `${apiUrls.sdk}/encrypt_proving_request`,
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
