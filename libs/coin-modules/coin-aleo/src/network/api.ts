import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import { PROGRAM_ID } from "../constants";
import {
  AleoAccountJWTResponse,
  AleoJWT,
  AleoLatestBlockResponse,
  AleoPrivateRecord,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
  AleoRecordScannerStatusResponse,
  AleoRegisterAccountResponse,
  AleoRegisterForRecordsResponse,
  DelegatedProvingResponse,
} from "../types/api";
import { getNetworkConfig } from "../logic/utils";
import { PrepareRequestBody } from "../types/sdk";

async function getLatestBlock(currency: CryptoCurrency): Promise<AleoLatestBlockResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(
  currency: CryptoCurrency,
  address: string,
): Promise<string | null> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<string | null>({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/programs/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

async function getTransactionById(
  currency: CryptoCurrency,
  transactionId: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoPublicTransactionDetailsResponse>({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/transactions/${transactionId}`,
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
  const { nodeUrl, networkType } = getNetworkConfig(currency);
  const params = new URLSearchParams({
    limit: limit.toString(),
    sort: order,
    direction,
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactionsResponse> = await network({
    method: "GET",
    url: `${nodeUrl}/v2/${networkType}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

async function submitDelegatedProvingRequest({
  currency,
  authorization,
  feeAuthorization,
  broadcast,
  jwt,
}: {
  currency: CryptoCurrency;
  authorization: PrepareRequestBody;
  feeAuthorization: PrepareRequestBody;
  broadcast: boolean;
  jwt: string;
}): Promise<DelegatedProvingResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${nodeUrl}/prove/${networkType}/prove`,
    headers: {
      authorization: jwt,
    },
    data: {
      authorization,
      fee_authorization: feeAuthorization,
      broadcast,
    },
  });

  return res.data;
}

async function getAccountOwnedRecords({
  currency,
  jwtToken,
  apiKey,
  uuid,
  unspent,
  start,
}: {
  currency: CryptoCurrency;
  jwtToken: string;
  apiKey: string;
  uuid: string;
  unspent?: boolean;
  start?: number;
}): Promise<AleoPrivateRecord[]> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoPrivateRecord[]>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/records/owned`,
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

async function registerNewAccount(
  currency: CryptoCurrency,
  username: string,
): Promise<AleoRegisterAccountResponse> {
  const { nodeUrl } = getNetworkConfig(currency);

  const res = await network<AleoRegisterAccountResponse>({
    method: "POST",
    url: `${nodeUrl}/consumers`,
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
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoRegisterForRecordsResponse>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/register`,
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
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoRecordScannerStatusResponse>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/status`,
    headers: {
      Authorization: accessToken,
      "Content-Type": "application/json",
    },
    data: `"${uuid.toString()}"`,
  });

  return res.data;
};

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getAccountOwnedRecords,
  getTransactionById,
  getAccountPublicTransactions,
  getAccountJWT,
  registerNewAccount,
  getRecordScannerStatus,
  registerForScanningAccountRecords,
  submitDelegatedProvingRequest,
};
