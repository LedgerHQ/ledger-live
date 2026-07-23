import network from "@ledgerhq/live-network";
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
} from "../types/api";
import type { AleoCoinConfig } from "../types";
import { PROGRAM_ID } from "../constants";

async function getLatestBlock(config: AleoCoinConfig): Promise<AleoLatestBlockResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoLatestBlockResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/blocks/latest`,
  });

  return res.data;
}

async function getAccountBalance(config: AleoCoinConfig, address: string): Promise<string | null> {
  const { apiUrls, networkType } = config;

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/account/${address}`,
  });

  return res.data;
}

/**
 * Fetches the public balance of an address-mapped token program
 * (e.g. usdcx_stablecoin.aleo, usad_stablecoin.aleo) for a given address.
 *
 * @param config - The Aleo coin config
 * @param programId - The token program id
 * @param address - The owner's Aleo address
 * @returns The balance in raw units (u128) or null if no balance exists
 */
async function getTokenBalance(
  config: AleoCoinConfig,
  programId: string,
  address: string,
): Promise<string | null> {
  const { apiUrls, networkType } = config;

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${programId}/mapping/balances/${address}`,
  });

  return res.data;
}

async function getTransactionById(
  config: AleoCoinConfig,
  transactionId: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoPublicTransactionDetailsResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/transactions/${transactionId}`,
  });

  return res.data;
}

async function getAccountPublicTransactions({
  config,
  address,
  cursor,
  limit = 50,
  order = "asc",
  direction = "next",
}: {
  config: AleoCoinConfig;
  address: string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  direction?: "prev" | "next";
}): Promise<AleoPublicTransactionsResponse> {
  const { apiUrls, networkType } = config;
  const params = new URLSearchParams({
    metadata: "true",
    limit: limit.toString(),
    sort: order,
    direction,
    token_info: "true",
    ...(cursor && { cursor_block_number: cursor }),
  });

  const res: LiveNetworkResponse<AleoPublicTransactionsResponse> = await network({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/transactions/address/${address}?${params.toString()}`,
  });

  return res.data;
}

async function getScannerPublicKey(
  config: AleoCoinConfig,
): Promise<AleoGetScannerPublicKeyResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoGetScannerPublicKeyResponse>({
    method: "GET",
    url: `${apiUrls.node}/scanner/${networkType}/pubkey`,
  });

  return res.data;
}

async function registerForScanningAccountRecordsEncrypted({
  config,
  encryptedData,
  keyId,
}: {
  config: AleoCoinConfig;
  encryptedData: string;
  keyId: string;
}): Promise<AleoRegisterForRecordsResponse> {
  const { apiUrls, networkType } = config;

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
  config: AleoCoinConfig,
  uuid: string,
): Promise<AleoRecordScannerStatusResponse> => {
  const { apiUrls, networkType } = config;

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
  config,
  uuid,
  unspent,
  start,
  resultsPerPage,
  page,
  programs,
  functions,
}: {
  config: AleoCoinConfig;
  uuid: string;
  unspent?: boolean;
  start?: number;
  resultsPerPage?: number;
  page?: number;
  programs?: string[];
  functions?: string[];
}): Promise<AleoPrivateRecord[]> {
  const { apiUrls, networkType } = config;

  const filter = {
    ...(typeof start === "number" && { start }),
    ...(typeof resultsPerPage === "number" && { results_per_page: resultsPerPage }),
    ...(typeof page === "number" && { page }),
    ...(programs && programs.length > 0 && { programs }),
    ...(functions && functions.length > 0 && { functions }),
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
  config,
  authorization,
  feeAuthorization,
  broadcast,
}: {
  config: AleoCoinConfig;
  authorization: Record<string, unknown>;
  feeAuthorization?: Record<string, unknown>;
  broadcast: boolean;
}): Promise<DelegatedProvingResponse> {
  const { apiUrls, networkType } = config;
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

/**
 * TEE node that issued the public key must be the same node that receives the encrypted proving request.
 * Browsers handle the cookie automatically (Electron renderer side),
 * but Node.js does not - so it needs to be captured and forwarded manually.
 */
async function getProvePublicKey({ config }: { config: AleoCoinConfig }): Promise<{
  data: AleoGetProvePublicKeyResponse;
  stickySessionCookie: string[] | null;
}> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoGetProvePublicKeyResponse>({
    method: "GET",
    url: `${apiUrls.node}/prove/${networkType}/pubkey`,
  });

  const stickySessionCookie = res.headers?.["set-cookie"] ?? null;

  return {
    data: res.data,
    stickySessionCookie,
  };
}

async function submitEncryptedDelegatedProvingRequest({
  config,
  keyId,
  encryptedData,
  stickySessionCookie,
}: {
  config: AleoCoinConfig;
  keyId: string;
  encryptedData: string;
  stickySessionCookie: string[] | null;
}): Promise<DelegatedProvingResponse> {
  const { apiUrls, networkType } = config;
  const res = await network<DelegatedProvingResponse>({
    method: "POST",
    url: `${apiUrls.node}/prove/${networkType}/prove/encrypted`,
    ...(stickySessionCookie && {
      headers: { Cookie: stickySessionCookie.join("; ") },
    }),
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
  getTokenBalance,
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
