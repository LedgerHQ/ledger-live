import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import aleoConfig from "../config";
import {
  AleoAccountJWTResponse,
  AleoLatestBlockResponse,
  AleoPrivateTransaction,
  AleoPublicTransactionDetails,
  AleoPublicTransactions,
  AleoRegisterAccountResponse,
  AleoRegisterForRecordsResponse,
} from "../types/api";
import { PROGRAM_ID } from "../constants";

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
): Promise<AleoPublicTransactionDetails> {
  const res = await network<AleoPublicTransactionDetails>({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/${transactionId}`,
  });

  return res.data;
}

async function registerNewAccount(username: string): Promise<AleoRegisterAccountResponse> {
  const res = await network<AleoRegisterAccountResponse>({
    method: "POST",
    url: "https://api.provable.com/consumers",
    data: { username },
  });

  return res.data;
}

async function getAccountJWT(
  apiKey: string,
  consumerId: string,
): Promise<LiveNetworkResponse<AleoAccountJWTResponse>> {
  const res = await network<AleoAccountJWTResponse>({
    method: "POST",
    url: `https://api.provable.com/jwts/${consumerId}`,
    headers: {
      "X-Provable-API-Key": apiKey,
    },
  });

  return res;
}

async function registerForScanningAccountRecords(
  jwtToken: string,
  viewKey: string,
  start: number = 0,
): Promise<AleoRegisterForRecordsResponse> {
  const res = await network<AleoRegisterForRecordsResponse>({
    method: "POST",
    url: "https://api.provable.com/scanner/mainnet/register",
    headers: {
      Authorization: jwtToken,
    },
    data: { view_key: viewKey, start },
  });

  return res.data;
}

async function decryptCiphertext<T>(ciphertext: string, viewKey: string): Promise<T> {
  const res = await network<T>({
    method: "POST",
    url: "https://aleo-backend.api.live.ledger.com/network/mainnet/decrypt",
    data: { ciphertext, view_key: viewKey },
  });

  return res.data;
}

async function getAccountOwnedRecords(
  jwtToken: string,
  uuid: string,
  apiKey: string,
): Promise<AleoPrivateTransaction[]> {
  const data = {
    response_filter: {
      block_height: true,
      checksum: true,
      commitment: true,
      record_ciphertext: true,
      function_name: true,
      nonce: true,
      output_index: true,
      owner: true,
      program_name: true,
      record_name: true,
      transaction_id: true,
      transition_id: true,
      transaction_index: true,
      transition_index: true,
    },
    uuid,
  };
  const res = await network<AleoPrivateTransaction[]>({
    method: "POST",
    url: "https://api.provable.com/scanner/mainnet/records/owned",
    headers: {
      Authorization: jwtToken,
      "X-Provable-API-Key": apiKey,
    },
    data,
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
}): Promise<AleoPublicTransactions> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    sort: order,
    direction,
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactions> = await network({
    method: "GET",
    url: `${getNodeUrl(currency)}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getTransactionById,
  getAccountPublicTransactions,
  getAccountJWT,
  registerNewAccount,
  registerForScanningAccountRecords,
  decryptCiphertext,
  getAccountOwnedRecords,
};
