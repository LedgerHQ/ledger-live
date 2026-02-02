import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import aleoConfig from "../config";
import { PROGRAM_ID } from "../constants";
import {
  AleoAccountJWTResponse,
  AleoDecryptedCiphertextResponse,
  AleoDecryptedRecordResponse,
  AleoJWT,
  AleoLatestBlockResponse,
  AleoPrivateRecord,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
  AleoRecordScannerStatusResponse,
  AleoRegisterAccountResponse,
  AleoRegisterForRecordsResponse,
} from "../types/api";

const getNodeUrl = (currency: CryptoCurrency): string => {
  return aleoConfig.getCoinConfig(currency).nodeUrl;
};

async function getLatestBlock(currency: CryptoCurrency): Promise<AleoLatestBlockResponse> {
  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${getNodeUrl(currency)}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<string | null> {
  const res = await network<string | null>({
    method: "GET",
    url: `${getNodeUrl(currency)}/programs/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

async function getTransactionById(
  currency: CryptoCurrency,
  transactionId: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const res = await network<AleoPublicTransactionDetailsResponse>({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/${transactionId}`,
  });

  return res.data;
}

async function getAccountPublicTransactions({
  currency,
  address,
  cursor,
  limit = 50,
  order = "asc",
  direction = "next",
}: {
  currency: CryptoCurrency;
  address: string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  direction?: "prev" | "next";
}): Promise<AleoPublicTransactionsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    sort: order,
    direction,
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactionsResponse> = await network({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

async function getAccountOwnedRecords({
  jwtToken,
  apiKey,
  uuid,
  unspent,
  start,
}: {
  jwtToken: string;
  apiKey: string;
  uuid: string;
  unspent?: boolean;
  start?: number;
}): Promise<AleoPrivateRecord[]> {
  const res = await network<AleoPrivateRecord[]>({
    method: "POST",
    url: "https://api.provable.com/scanner/mainnet/records/owned",
    headers: {
      Authorization: jwtToken,
      "X-Provable-API-Key": apiKey,
    },
    data: {
      ...(unspent !== undefined && { unspent }),
      ...(start !== undefined && { filter: { start } }),
      uuid,
    },
  });

  return res.data;
}

async function decryptRecord(
  ciphertext: string,
  viewKey: string,
): Promise<AleoDecryptedRecordResponse> {
  const res = await network<AleoDecryptedRecordResponse>({
    method: "POST",
    url: "https://aleo-backend.api.live.ledger.com/network/mainnet/decrypt",
    data: { ciphertext, view_key: viewKey },
  });

  return res.data;
}

async function registerNewAccount(
  currency: CryptoCurrency,
  username: string,
): Promise<AleoRegisterAccountResponse> {
  const res = await network<AleoRegisterAccountResponse>({
    method: "POST",
    url: `https://api.provable.com/consumers`,
    data: { username },
  });

  return res.data;
}

async function getAccountJWT(
  currency: CryptoCurrency,
  apiKey: string,
  consumerId: string,
): Promise<AleoJWT> {
  const res = await network<AleoAccountJWTResponse>({
    method: "POST",
    url: `https://api.provable.com/jwts/${consumerId}`,
    headers: {
      "X-Provable-API-Key": apiKey,
    },
  });

  const data = {
    token: res.headers?.["authorization"] ?? "",
    exp: res.data.exp,
  };

  return data;
}

async function registerForScanningAccountRecords(
  currency: CryptoCurrency,
  jwt: string,
  viewKey: string,
  start: number = 0,
): Promise<AleoRegisterForRecordsResponse> {
  const res = await network<AleoRegisterForRecordsResponse>({
    method: "POST",
    url: `https://api.provable.com/scanner/mainnet/register`,
    headers: {
      Authorization: jwt,
    },
    data: { view_key: viewKey, start },
  });

  return res.data;
}

export const getRecordScannerStatus = async (
  currency: CryptoCurrency,
  accessToken: string,
  uuid: string,
): Promise<AleoRecordScannerStatusResponse> => {
  const res = await network<AleoRecordScannerStatusResponse>({
    method: "POST",
    url: "https://api.provable.com/scanner/mainnet/status",
    headers: {
      Authorization: accessToken,
      "Content-Type": "application/json",
    },
    data: `"${uuid.toString()}"`,
  });

  return res.data;
};

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

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getAccountOwnedRecords,
  getTransactionById,
  getAccountPublicTransactions,
  getAccountJWT,
  registerNewAccount,
  getRecordScannerStatus,
  decryptRecord,
  decryptCiphertext,
  registerForScanningAccountRecords,
};
