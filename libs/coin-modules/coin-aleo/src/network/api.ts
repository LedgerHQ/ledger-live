import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import type {
  AleoLatestBlockResponse,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
  AleoRecordScannerStatusResponse,
  AleoRegisterForRecordsResponse,
  AleoGetScannerPublicKeyResponse,
  AleoGetProvePublicKeyResponse,
  AleoPrivateRecord,
  DelegatedProvingResponse,
  AleoCreateTransferIntentRequest,
  AleoTransferIntentResponse,
  AleoCreateAuthorizationRequest,
  AleoAuthorizationResponse,
} from "../types/api";
import { getNetworkConfig } from "../logic/utils";
import { PROGRAM_ID } from "../constants";

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
    url: `${nodeUrl}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
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
    metadata: "true",
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

async function getScannerPublicKey(
  currency: CryptoCurrency,
): Promise<AleoGetScannerPublicKeyResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoGetScannerPublicKeyResponse>({
    method: "GET",
    url: `${nodeUrl}/scanner/${networkType}/pubkey`,
  });

  return res.data;
}

async function registerForScanningAccountRecordsEncrypted({
  currency,
  encryptedData,
  keyId,
}: {
  currency: CryptoCurrency;
  encryptedData: string;
  keyId: string;
}): Promise<AleoRegisterForRecordsResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoRegisterForRecordsResponse>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/register/encrypted`,
    data: {
      key_id: keyId,
      ciphertext: encryptedData,
    },
  });

  return res.data;
}

const getRecordScannerStatus = async (
  currency: CryptoCurrency,
  uuid: string,
): Promise<AleoRecordScannerStatusResponse> => {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoRecordScannerStatusResponse>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/status`,
    headers: {
      "Content-Type": "application/json",
    },
    data: `"${uuid.toString()}"`,
  });

  return res.data;
};

async function getAccountOwnedRecords({
  currency,
  uuid,
  unspent,
  start,
  resultsPerPage,
  page,
  programs,
  functions,
}: {
  currency: CryptoCurrency;
  uuid: string;
  unspent?: boolean;
  start?: number;
  resultsPerPage?: number;
  page?: number;
  programs?: string[];
  functions?: string[];
}): Promise<AleoPrivateRecord[]> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const filter = {
    ...(typeof start === "number" && { start }),
    ...(typeof resultsPerPage === "number" && { results_per_page: resultsPerPage }),
    ...(typeof page === "number" && { page }),
    ...(programs && programs.length > 0 && { programs }),
    ...(functions && functions.length > 0 && { functions }),
  };

  const res = await network<AleoPrivateRecord[]>({
    method: "POST",
    url: `${nodeUrl}/scanner/${networkType}/records/owned`,
    data: {
      ...(typeof unspent === "boolean" && { unspent }),
      ...(Object.keys(filter).length > 0 && { filter }),
      uuid,
    },
  });

  return res.data;
}

async function submitDelegatedProvingRequest({
  currency,
  authorization,
  feeAuthorization,
  broadcast,
}: {
  currency: CryptoCurrency;
  authorization: Record<string, unknown>;
  feeAuthorization?: Record<string, unknown>;
  broadcast: boolean;
}): Promise<DelegatedProvingResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${nodeUrl}/prove/${networkType}/prove`,
    data: {
      authorization,
      ...(feeAuthorization ? { fee_authorization: feeAuthorization } : {}),
      broadcast,
    },
  });

  return res.data;
}

async function getProvePublicKey({
  currency,
}: {
  currency: CryptoCurrency;
}): Promise<AleoGetProvePublicKeyResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoGetProvePublicKeyResponse>({
    method: "GET",
    url: `${nodeUrl}/prove/${networkType}/pubkey`,
  });

  return res.data;
}

async function submitEncryptedDelegatedProvingRequest({
  currency,
  keyId,
  encryptedData,
}: {
  currency: CryptoCurrency;
  keyId: string;
  encryptedData: string;
}): Promise<DelegatedProvingResponse> {
  const { nodeUrl, networkType } = getNetworkConfig(currency);
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${nodeUrl}/prove/${networkType}/prove/encrypted`,
    data: {
      key_id: keyId,
      ciphertext: encryptedData,
    },
  });

  return res.data;
}

async function createTransferIntent({
  intent,
  viewKey,
  fee,
}: {
  intent: AleoCreateTransferIntentRequest["intent"];
  viewKey: string;
  fee: AleoCreateTransferIntentRequest["fee"];
}): Promise<AleoTransferIntentResponse> {
  const res = await network<AleoTransferIntentResponse>({
    method: "POST",
    url: `http://10.3.19.130/network/testnet/transactions/request`,
    data: {
      intent,
      view_key: viewKey,
      fee,
    },
  });

  return res.data;
}

async function createAuthorization({
  request,
  signatures,
  viewKey,
  tlvVersion,
}: {
  request: AleoCreateAuthorizationRequest["request"];
  signatures: string;
  viewKey: string;
  tlvVersion: number;
}): Promise<AleoAuthorizationResponse> {
  const res = await network<AleoAuthorizationResponse>({
    method: "POST",
    url: `http://10.3.19.130/network/testnet/transactions/authorization`,
    data: {
      request,
      signatures,
      view_key: viewKey,
      tlv_version: tlvVersion,
    },
  });

  return res.data;
}

export const apiClient = {
  getLatestBlock,
  getAccountBalance,
  getTransactionById,
  getAccountPublicTransactions,
  getRecordScannerStatus,
  getScannerPublicKey,
  getProvePublicKey,
  getAccountOwnedRecords,
  registerForScanningAccountRecordsEncrypted,
  submitDelegatedProvingRequest,
  submitEncryptedDelegatedProvingRequest,
  createTransferIntent,
  createAuthorization,
};
