import network from "@ledgerhq/live-network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AleoDecryptedCiphertextResponse, AleoDecryptedRecordResponse } from "../types";
import {
  AuthorizationResponse,
  DevKeysResponse,
  DevSignatureData,
  Intent,
  PreparedRequestResponse,
} from "../types/sdk";
import { getNetworkConfig } from "../logic/utils";

async function decryptRecord({
  currency,
  ciphertext,
  viewKey,
}: {
  currency: CryptoCurrency;
  ciphertext: string;
  viewKey: string;
}): Promise<AleoDecryptedRecordResponse> {
  const { networkType } = getNetworkConfig(currency);

  const res = await network<AleoDecryptedRecordResponse>({
    method: "POST",
    url: `https://aleo-backend.api.live.ledger.com/network/${networkType}/decrypt`,
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
  const { networkType } = getNetworkConfig(currency);

  const res = await network<AleoDecryptedCiphertextResponse>({
    method: "POST",
    url: `https://aleo-backend.api.live.ledger-test.com/network/${networkType}/symmetric_decrypt`,
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
  viewKey,
}: {
  currency: CryptoCurrency;
  intent: Intent;
  viewKey: string;
}) {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<PreparedRequestResponse>({
    method: "POST",
    url: `${sdkUrl}/transactions/request`,
    data: {
      intent,
      view_key: viewKey,
    },
  });

  return res.data;
}

async function createAuthorization({
  currency,
  request,
  signatures,
  viewKey,
  computeKey,
}: {
  currency: CryptoCurrency;
  request: PreparedRequestResponse;
  signatures: DevSignatureData;
  viewKey: string;
  computeKey: string;
}) {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AuthorizationResponse>({
    method: "POST",
    url: `${sdkUrl}/transactions/authorization`,
    data: {
      request,
      signatures,
      view_key: viewKey,
      compute_key: computeKey,
    },
  });

  return res.data;
}

async function getDevKeys({ currency }: { currency: CryptoCurrency }) {
  const { networkType } = getNetworkConfig(currency);

  const res = await network<DevKeysResponse>({
    method: "GET",
    url: `http://10.3.19.130/network/${networkType}/dev/keys`,
  });

  return res.data;
}

async function devSign({
  currency,
  request,
}: {
  currency: CryptoCurrency;
  request: PreparedRequestResponse;
}) {
  const { networkType } = getNetworkConfig(currency);

  const res = await network<DevSignatureData>({
    method: "POST",
    url: `http://10.3.19.130/network/${networkType}/dev/sign`,
    data: request,
  });

  return res.data;
}

export const sdkClient = {
  decryptRecord,
  decryptCiphertext,
  createAuthorization,
  createRequestFromIntent,
  getDevKeys,
  devSign,
};
