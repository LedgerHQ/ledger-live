import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { LiveNetworkRequest, LiveNetworkResponse } from "@ledgerhq/live-network/network";
import type { CantonCoinConfig } from "../config";
import { TopologyChangeError, TransferOfferExpiredError } from "../types/errors";
import type {
  GetBalanceResponse,
  GetTransferPreApprovalResponse,
  OnboardingPrepareRequest,
  OnboardingPrepareResponse,
  OnboardingSubmitRequest,
  OnboardingSubmitResponse,
  OperationView,
  Party,
  PrepareTapResponse,
  PrepareTransferInstructionRequest,
  PrepareTransferRequest,
  PrepareTransferResponse,
  SubmitTapRequestRequest,
  SubmitTapRequestResponse,
  SubmitTransactionRequest,
  SubmitTransactionResponse,
  TapRequest,
  TransferProposal,
} from "../types/gateway";
import { TransactionType } from "../types/gateway";
import {
  PreApprovalResult,
  PrepareTransactionRequest,
  PrepareTransactionResponse,
} from "../types/onboard";
import type { CantonSignature } from "../types/signer";

export const SEPARATOR = "____";
export const DEFAULT_TAP_REQUEST_AMOUNT = "100000000000000000000000000000000000000";

export const getKey = (id: string, adminId: string) => `${id}${SEPARATOR}${adminId}`;

const getGatewayUrl = (config: CantonCoinConfig) => config.gatewayUrl;
export const getNodeId = (config: CantonCoinConfig) => {
  const overrideNodeId = getEnv("CANTON_NODE_ID_OVERRIDE");
  if (overrideNodeId) {
    return overrideNodeId;
  }
  return config.nodeId || "ledger-live-devnet";
};
export const getNetworkType = (config: CantonCoinConfig) => config.networkType;

export function isGatewayEnabled(config: CantonCoinConfig): boolean {
  return config.useGateway === true;
}

export const isPartyNotFound = (error: unknown): boolean => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase().replace(/_/g, " ");
    return errorMessage.includes("party") && errorMessage.includes("not found");
  }
  return false;
};

// live-network keeps only the body `message` and drops the gateway's TRANSFER_OFFER_EXPIRED `type`.
export const isTransferOfferExpired = (error: unknown): boolean =>
  error instanceof Error && error.message.toLowerCase().includes("transfer offer has expired");

export const isPartyAlreadyExists = (error: unknown): boolean => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase().replace(/_/g, " ");
    return errorMessage.includes("party") && errorMessage.includes("already exists");
  }
  return false;
};

const gatewayNetwork = async <T, U = unknown>(
  req: LiveNetworkRequest<U>,
): Promise<LiveNetworkResponse<T>> => {
  const API_KEY = getEnv("CANTON_API_KEY");
  try {
    return await network<T, U>({
      ...req,
      headers: {
        ...(req.headers || {}),
        ...(API_KEY ? { "X-Ledger-Canton-Api-Key": API_KEY } : {}),
      },
    });
  } catch (error) {
    if (isPartyNotFound(error)) {
      throw new TopologyChangeError("Topology change detected. Re-onboarding required.");
    }
    if (isTransferOfferExpired(error)) {
      throw new TransferOfferExpiredError("Transfer offer has expired.");
    }
    throw error;
  }
};

/*
 * Parties
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#tag/Parties
 */

export async function getPartyById(config: CantonCoinConfig, partyId: string): Promise<Party> {
  return await getParty(config, partyId, "party-id");
}

export async function getPartyByPubKey(config: CantonCoinConfig, pubKey: string): Promise<Party> {
  return await getParty(config, pubKey, "public-key");
}

async function getParty(
  config: CantonCoinConfig,
  identifier: string,
  by: "party-id" | "public-key",
): Promise<Party> {
  const { data } = await gatewayNetwork<Party>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${identifier}?by=${by}`,
  });
  return data;
}

export async function prepareOnboarding(
  config: CantonCoinConfig,
  pubKey: string,
): Promise<OnboardingPrepareResponse> {
  const gatewayUrl = getGatewayUrl(config);
  const nodeId = getNodeId(config);
  const fullUrl = `${gatewayUrl}/v1/node/${nodeId}/onboarding/prepare`;

  const { data } = await gatewayNetwork<OnboardingPrepareResponse, OnboardingPrepareRequest>({
    method: "POST",
    url: fullUrl,
    data: {
      public_key: pubKey,
      public_key_type: "ed25519",
    },
  });

  return data;
}

export async function isTopologyChangeRequired(config: CantonCoinConfig, pubKey: string) {
  try {
    const response = await prepareOnboarding(config, pubKey);
    // if response is not undefined (we have a transaction to sign) topology change is required
    if (response) {
      return true;
    }
    return false;
  } catch (error) {
    if (isPartyAlreadyExists(error)) {
      return false;
    }
    throw error;
  }
}

const getIsTopologyChangeRequiredCacheKey = (config: CantonCoinConfig, pubKey: string): string => {
  const nodeId = getNodeId(config);
  return `${pubKey}_${nodeId}`;
};

export const isTopologyChangeRequiredCached = makeLRUCache(
  isTopologyChangeRequired,
  getIsTopologyChangeRequiredCacheKey,
  minutes(10),
);

export function clearIsTopologyChangeRequiredCache(config: CantonCoinConfig, pubKey: string): void {
  const cacheKey = getIsTopologyChangeRequiredCacheKey(config, pubKey);
  isTopologyChangeRequiredCached.clear(cacheKey);
}

export type InstrumentInfo = {
  id: string;
  admin: string;
};

export type InstrumentsResponse = InstrumentInfo[];

export async function getEnabledInstruments(config: CantonCoinConfig): Promise<Set<string>> {
  try {
    const { data } = await gatewayNetwork<InstrumentsResponse>({
      method: "GET",
      url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/instruments`,
    });
    return new Set(data.map(({ id, admin }) => getKey(id, admin)));
  } catch (error) {
    // If API fails, return empty array (fail-safe: only native instrument will work)
    console.error("Failed to fetch enabled instruments:", error);
    return new Set();
  }
}

const getEnabledInstrumentsCacheKey = (config: CantonCoinConfig): string => {
  const nodeId = getNodeId(config);
  return `instruments_${nodeId}`;
};

export const getEnabledInstrumentsCached = makeLRUCache(
  getEnabledInstruments,
  getEnabledInstrumentsCacheKey,
  minutes(15),
);

export function clearEnabledInstrumentsCache(config: CantonCoinConfig): void {
  const cacheKey = getEnabledInstrumentsCacheKey(config);
  getEnabledInstrumentsCached.clear(cacheKey);
}

export async function submitOnboarding(
  config: CantonCoinConfig,
  publicKey: string,
  prepareResponse: OnboardingPrepareResponse,
  { signature, applicationSignature }: CantonSignature,
) {
  try {
    const { data } = await gatewayNetwork<OnboardingSubmitResponse, OnboardingSubmitRequest>({
      method: "POST",
      url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/onboarding/submit`,
      data: {
        prepare_request: {
          public_key: publicKey,
          public_key_type: "ed25519",
        },
        prepare_response: prepareResponse,
        signature,
        ...(applicationSignature ? { application_signature: applicationSignature } : {}),
      },
    });
    return data;
  } catch (error) {
    if (isPartyAlreadyExists(error)) {
      // If party already exists, use party_id from prepare response
      // The network layer strips custom properties from errors, so we can't extract partyId from error
      return {
        party: {
          party_id: prepareResponse.party_id,
          public_key: publicKey,
        },
      };
    }

    throw error;
  }
}

/*
 * State
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#tag/State
 */

export async function getBalance(config: CantonCoinConfig, partyId: string) {
  const { data } = await gatewayNetwork<GetBalanceResponse>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/balance`,
  });
  return Array.isArray(data) ? data : (data.balances ?? []);
}

export async function getOperations(
  config: CantonCoinConfig,
  partyId: string,
  options?: {
    cursor?: number | undefined;
    minOffset?: number | undefined;
    maxOffset?: number | undefined;
    limit?: number | undefined;
  },
): Promise<{
  next: number;
  operations: OperationView[];
}> {
  const { data } = await gatewayNetwork<{
    next: number;
    operations: OperationView[];
  }>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/operations`,
    params: options,
  });
  return data;
}

export async function getPendingTransferProposals(config: CantonCoinConfig, partyId: string) {
  const { data } = await gatewayNetwork<TransferProposal[]>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transfer-proposals?timestamp=${Date.now()}`,
  });
  return data;
}

export async function getTransferPreApproval(config: CantonCoinConfig, partyId: string) {
  const { data } = await gatewayNetwork<GetTransferPreApprovalResponse>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transfer-preapproval`,
  });
  return data;
}

export async function getLedgerEnd(config: CantonCoinConfig): Promise<number> {
  const { data } = await gatewayNetwork<number>({
    method: "GET",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/ledger-end`,
  });
  return data;
}

/*
 * Transaction
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#tag/Transaction
 */

export async function prepare(
  config: CantonCoinConfig,
  partyId: string,
  params: PrepareTransferRequest | PrepareTransferInstructionRequest,
) {
  const { data } = await gatewayNetwork<
    PrepareTransferResponse,
    PrepareTransferRequest | PrepareTransferInstructionRequest
  >({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/prepare`,
    data: params,
  });
  return data;
}

export async function prepareTransferRequest(
  config: CantonCoinConfig,
  partyId: string,
  params: PrepareTransferRequest,
) {
  return prepare(config, partyId, params);
}

export async function prepareTransferInstruction(
  config: CantonCoinConfig,
  partyId: string,
  params: PrepareTransferInstructionRequest,
) {
  return prepare(config, partyId, params);
}

export async function preparePreApprovalTransaction(config: CantonCoinConfig, partyId: string) {
  const { data } = await gatewayNetwork<PrepareTransactionResponse, PrepareTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/prepare`,
    data: {
      type: TransactionType.TRANSFER_PRE_APPROVAL_PROPOSAL,
      receiver: partyId,
    },
  });
  return data;
}

export async function prepareTapRequest(config: CantonCoinConfig, { partyId, amount }: TapRequest) {
  // Default to 1.0 in fixed-point representation (1 * 10^38)
  const fixedPointAmount = amount ?? DEFAULT_TAP_REQUEST_AMOUNT;

  const { data } = await gatewayNetwork<PrepareTapResponse, { amount: string; type: string }>({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/prepare`,
    data: {
      amount: fixedPointAmount.toString(),
      type: TransactionType.TAP_REQUEST,
    },
  });
  return data;
}

export async function submit(
  config: CantonCoinConfig,
  partyId: string,
  serialized: string,
  signature: string,
) {
  const { data } = await gatewayNetwork<SubmitTransactionResponse, SubmitTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

export async function submitTransferInstruction(
  config: CantonCoinConfig,
  partyId: string,
  serialized: string,
  signature: string,
) {
  return submit(config, partyId, serialized, signature);
}

export async function submitPreApprovalTransaction(
  config: CantonCoinConfig,
  partyId: string,
  { serialized }: PrepareTransactionResponse,
  signature: string,
) {
  const { data } = await gatewayNetwork<SubmitTransactionResponse, SubmitTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });

  return {
    isApproved: true,
    submissionId: data.submission_id,
    updateId: data.update_id,
  } satisfies PreApprovalResult;
}

export async function submitTapRequest(
  config: CantonCoinConfig,
  { partyId, serialized, signature }: SubmitTapRequestRequest,
) {
  const { data } = await gatewayNetwork<
    SubmitTapRequestResponse,
    Omit<SubmitTapRequestRequest, "partyId">
  >({
    method: "POST",
    url: `${getGatewayUrl(config)}/v1/node/${getNodeId(config)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

// CAL API types
export type CalToken = {
  id: string;
  name: string;
  ticker: string;
  network: string;
  contract_address: string;
  token_identifier: string;
};

/**
 * Fetch Canton tokens from CAL service and create a map of id -> token_identifier.
 * Keyed by currency id, which the config does not carry.
 */
async function getCalTokens(currencyId: string): Promise<Map<string, string>> {
  const calUrl = getEnv("CAL_SERVICE_URL");
  const { data: calTokens } = await gatewayNetwork<CalToken[]>({
    method: "GET",
    url: `${calUrl}/v1/tokens?network=${currencyId}&output=id,name,ticker,network,contract_address,token_identifier,units,standard`,
  });

  // Map id -> token_identifier
  const tokenIdentifierMap = new Map<string, string>();
  for (const token of calTokens) {
    tokenIdentifierMap.set(token.id, token.token_identifier);
  }
  return tokenIdentifierMap;
}

const getCalTokensCacheKey = (currencyId: string): string => currencyId;

export const getCalTokensCached = makeLRUCache(getCalTokens, getCalTokensCacheKey, minutes(30));

// Re-export types that are needed by other modules
export type {
  TransferProposal,
  OnboardingPrepareResponse,
  PrepareTransferResponse,
  OperationView,
} from "../types/gateway";

// Type alias for backward compatibility
export type OperationInfo = OperationView;
