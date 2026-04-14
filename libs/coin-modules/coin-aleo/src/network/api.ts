import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import { PROGRAM_ID } from "../constants";
import { resolveConfig } from "../logic/utils";
import type { AleoCoinConfig } from "../types";
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
} from "../types/api";

async function getLatestBlock(
  configOrCurrencyId: AleoCoinConfig | string,
): Promise<AleoLatestBlockResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(
  configOrCurrencyId: AleoCoinConfig | string,
  address: string,
): Promise<string | null> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

async function getTransactionById(
  configOrCurrencyId: AleoCoinConfig | string,
  transactionId: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoPublicTransactionDetailsResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/transactions/${transactionId}`,
  });

  return res.data;
}

async function getAccountPublicTransactions({
  configOrCurrencyId,
  address,
  cursor,
  limit = 50,
  order = "asc",
  direction = "next",
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  address: string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  direction?: "prev" | "next";
}): Promise<AleoPublicTransactionsResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);
  const params = new URLSearchParams({
    metadata: "true",
    limit: limit.toString(),
    sort: order,
    direction,
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactionsResponse> = await network({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

async function getScannerPublicKey(
  configOrCurrencyId: AleoCoinConfig | string,
): Promise<AleoGetScannerPublicKeyResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoGetScannerPublicKeyResponse>({
    method: "GET",
    url: `${apiUrls.node}/scanner/${networkType}/pubkey`,
  });

  return res.data;
}

async function registerForScanningAccountRecordsEncrypted({
  configOrCurrencyId,
  encryptedData,
  keyId,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  encryptedData: string;
  keyId: string;
}): Promise<AleoRegisterForRecordsResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoRegisterForRecordsResponse>({
    method: "POST",
    url: `${apiUrls.node}/scanner/${networkType}/register/encrypted`,
    data: {
      key_id: keyId,
      ciphertext: encryptedData,
    },
  });

  return res.data;
}

const getRecordScannerStatus = async (
  configOrCurrencyId: AleoCoinConfig | string,
  uuid: string,
): Promise<AleoRecordScannerStatusResponse> => {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoRecordScannerStatusResponse>({
    method: "POST",
    url: `${apiUrls.node}/scanner/${networkType}/status`,
    headers: {
      "Content-Type": "application/json",
    },
    data: `"${uuid.toString()}"`,
  });

  return res.data;
};

async function getAccountOwnedRecords({
  configOrCurrencyId,
  uuid,
  unspent,
  start,
  resultsPerPage,
  page,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  uuid: string;
  unspent?: boolean;
  start?: number;
  resultsPerPage?: number;
  page?: number;
}): Promise<AleoPrivateRecord[]> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const filter = {
    ...(typeof start === "number" && { start }),
    ...(typeof resultsPerPage === "number" && { results_per_page: resultsPerPage }),
    ...(typeof page === "number" && { page }),
  };

  const res = await network<AleoPrivateRecord[]>({
    method: "POST",
    url: `${apiUrls.node}/scanner/${networkType}/records/owned`,
    data: {
      ...(typeof unspent === "boolean" && { unspent }),
      ...(Object.keys(filter).length > 0 && { filter }),
      uuid,
    },
  });

  return res.data;
}

async function submitDelegatedProvingRequest({
  configOrCurrencyId,
  authorization,
  feeAuthorization,
  broadcast,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  authorization: Record<string, unknown>;
  feeAuthorization?: Record<string, unknown>;
  broadcast: boolean;
}): Promise<DelegatedProvingResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${apiUrls.node}/prove/${networkType}/prove`,
    data: {
      authorization,
      ...(feeAuthorization ? { fee_authorization: feeAuthorization } : {}),
      broadcast,
    },
  });

  return res.data;
}

async function getProvePublicKey({
  configOrCurrencyId,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
}): Promise<AleoGetProvePublicKeyResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);

  const res = await network<AleoGetProvePublicKeyResponse>({
    method: "GET",
    url: `${apiUrls.node}/prove/${networkType}/pubkey`,
  });

  return res.data;
}

async function submitEncryptedDelegatedProvingRequest({
  configOrCurrencyId,
  keyId,
  encryptedData,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  keyId: string;
  encryptedData: string;
}): Promise<DelegatedProvingResponse> {
  const { apiUrls, networkType } = resolveConfig(configOrCurrencyId);
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${apiUrls.node}/prove/${networkType}/prove/encrypted`,
    data: {
      key_id: keyId,
      ciphertext: encryptedData,
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
};
