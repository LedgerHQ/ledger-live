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
  AleoGetTokensResponse,
  AleoPrivateRecord,
  DelegatedProvingResponse,
  AleoTransitionCursor,
  AleoCommitteeResponse,
  AleoValidatorMetadataResponse,
  AleoTotalSupplyResponse,
} from "../types/api";
import type { AleoCoinConfig } from "../types";
import { MAX_TRANSITIONS_PER_PAGE, PROGRAM_ID } from "../constants";

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

async function getBondedMapping(config: AleoCoinConfig, address: string): Promise<string | null> {
  const { apiUrls, networkType } = config;

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/bonded/${address}`,
  });

  return res.data;
}

async function getUnbondingMapping(
  config: AleoCoinConfig,
  address: string,
): Promise<string | null> {
  const { apiUrls, networkType } = config;

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/unbonding/${address}`,
  });

  return res.data;
}

async function getWithdrawMapping(config: AleoCoinConfig, address: string): Promise<string | null> {
  const { apiUrls, networkType } = config;

  const res = await network<string | null>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/program/${PROGRAM_ID.CREDITS}/mapping/withdraw/${address}`,
  });

  return res.data;
}

async function getCommittee(config: AleoCoinConfig): Promise<AleoCommitteeResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoCommitteeResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/committee/latest`,
  });

  return res.data;
}

async function getValidatorMetadata(
  config: AleoCoinConfig,
): Promise<AleoValidatorMetadataResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoValidatorMetadataResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/committee/validator-metadata`,
  });

  return res.data;
}

async function getTotalSupply(config: AleoCoinConfig): Promise<AleoTotalSupplyResponse> {
  const { apiUrls, networkType } = config;

  const res = await network<AleoTotalSupplyResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/latest/totalSupply`,
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

/**
 * Fetches the registry of known tokens on the network (ARC-20, ARC-21 and ARC-22 alike).
 *
 * @param config - The Aleo coin config
 * @param params.limit - Max items to return (server default: 20)
 * @param params.offset - Number of items to skip (server default: 0)
 */
async function getTokens({
  config,
  options = {},
}: {
  config: AleoCoinConfig;
  options?: {
    verified?: boolean;
    symbol?: string;
    limit?: number;
    offset?: number;
  };
}): Promise<AleoGetTokensResponse> {
  const { apiUrls, networkType } = config;
  const params = new URLSearchParams({
    ...(options.symbol && { symbol: options.symbol }),
    ...(typeof options.verified === "boolean" && { verified: options.verified.toString() }),
    ...(typeof options.limit === "number" && { limit: options.limit.toString() }),
    ...(typeof options.offset === "number" && { offset: options.offset.toString() }),
  });

  const res = await network<AleoGetTokensResponse>({
    method: "GET",
    url: `${apiUrls.node}/v2/${networkType}/tokens?${params.toString()}`,
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
  limit = MAX_TRANSITIONS_PER_PAGE,
  order = "asc",
  direction = "next",
}: {
  config: AleoCoinConfig;
  address: string;
  cursor?: AleoTransitionCursor;
  limit?: number;
  order?: "asc" | "desc";
  direction?: "prev" | "next";
}): Promise<AleoPublicTransactionsResponse> {
  const { apiUrls, networkType } = config;
  const params = new URLSearchParams({
    metadata: "true",
    limit: Math.min(limit, MAX_TRANSITIONS_PER_PAGE).toString(),
    sort: order,
    direction,
    token_info: "true",
    ...(cursor && {
      cursor_block_number: cursor.blockNumber.toString(),
      // Sending the block alone resumes after the *whole* block, silently dropping the transitions of
      // it that were not read yet. Verified against mainnet: 10 of 357 rows lost on one account.
      ...(cursor.transitionId && { cursor_transition_id: cursor.transitionId }),
    }),
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
  end,
  resultsPerPage,
  page,
  programs,
  functions,
}: {
  config: AleoCoinConfig;
  uuid: string;
  unspent?: boolean;
  start?: number;
  end?: number;
  resultsPerPage?: number;
  page?: number;
  programs?: string[];
  functions?: string[];
}): Promise<AleoPrivateRecord[]> {
  const { apiUrls, networkType } = config;

  const filter = {
    ...(typeof start === "number" && { start }),
    ...(typeof end === "number" && { end }),
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
  getBondedMapping,
  getUnbondingMapping,
  getWithdrawMapping,
  getCommittee,
  getValidatorMetadata,
  getTotalSupply,
  getTokenBalance,
  getTokens,
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
