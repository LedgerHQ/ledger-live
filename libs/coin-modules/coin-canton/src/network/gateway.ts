import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { LiveNetworkRequest, LiveNetworkResponse } from "@ledgerhq/live-network/network";
import crypto from "crypto";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import { TopologyChangeError } from "../types/errors";
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

/*
 * Helper Functions
 */

const getGatewayUrl = (currency: CryptoCurrency) => coinConfig.getCoinConfig(currency).gatewayUrl;
const getNodeId = (currency: CryptoCurrency) => {
  const overrideNodeId = getEnv("CANTON_NODE_ID_OVERRIDE");
  if (overrideNodeId) {
    return overrideNodeId;
  }
  return coinConfig.getCoinConfig(currency).nodeId || "ledger-live-devnet";
};
export const getNetworkType = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).networkType;

export const isPartyNotFound = (error: unknown): boolean => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase().replace(/_/g, " ");
    return errorMessage.includes("party") && errorMessage.includes("not found");
  }
  return false;
};

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
        ...(API_KEY && { "X-Ledger-Canton-Api-Key": API_KEY }),
      },
    });
  } catch (error) {
    if (isPartyNotFound(error)) {
      throw new TopologyChangeError("Topology change detected. Re-onboarding required.");
    }
    throw error;
  }
};

const getPrepareOnboardingCacheKey = (currency: CryptoCurrency, pubKey: string): string =>
  `${currency.id}_${pubKey}`;

/*
 * Parties
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#tag/Parties
 */

export async function getPartyById(currency: CryptoCurrency, partyId: string): Promise<Party> {
  return await getParty(currency, partyId, "party-id");
}

export async function getPartyByPubKey(currency: CryptoCurrency, pubKey: string): Promise<Party> {
  return await getParty(currency, pubKey, "public-key");
}

async function getParty(
  currency: CryptoCurrency,
  identifier: string,
  by: "party-id" | "public-key",
): Promise<Party> {
  const { data } = await gatewayNetwork<Party>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${identifier}?by=${by}`,
  });
  return data;
}

export async function prepareOnboarding(
  currency: CryptoCurrency,
  pubKey: string,
): Promise<OnboardingPrepareResponse> {
  const gatewayUrl = getGatewayUrl(currency);
  const nodeId = getNodeId(currency);
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

export async function isTopologyChangeRequired(currency: CryptoCurrency, pubKey: string) {
  try {
    const response = await prepareOnboarding(currency, pubKey);
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

const getIsTopologyChangeRequiredCacheKey = (currency: CryptoCurrency, pubKey: string): string => {
  const nodeId = getNodeId(currency);
  return `${pubKey}_${nodeId}`;
};

export const isTopologyChangeRequiredCached = makeLRUCache(
  isTopologyChangeRequired,
  getIsTopologyChangeRequiredCacheKey,
  minutes(10),
);

export function clearIsTopologyChangeRequiredCache(currency: CryptoCurrency, pubKey: string): void {
  const cacheKey = getIsTopologyChangeRequiredCacheKey(currency, pubKey);
  isTopologyChangeRequiredCached.clear(cacheKey);
}

export async function submitOnboarding(
  currency: CryptoCurrency,
  publicKey: string,
  prepareResponse: OnboardingPrepareResponse,
  { signature, applicationSignature }: CantonSignature,
) {
  try {
    const { data } = await gatewayNetwork<OnboardingSubmitResponse, OnboardingSubmitRequest>({
      method: "POST",
      url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/onboarding/submit`,
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

export async function getBalance(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<GetBalanceResponse>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/balance`,
  });
  return Array.isArray(data) ? data : data.balances;
}

export async function getOperations(
  currency: CryptoCurrency,
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
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/operations`,
    params: options,
  });
  return data;
}

export async function getPendingTransferProposals(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<TransferProposal[]>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transfer-proposals?timestamp=${Date.now()}`,
  });
  return data;
}

export async function getTransferPreApproval(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<GetTransferPreApprovalResponse>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transfer-preapproval`,
  });
  return data;
}

export async function getLedgerEnd(currency: CryptoCurrency): Promise<number> {
  const { data } = await gatewayNetwork<number>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/ledger-end`,
  });
  return data;
}

/*
 * Transaction
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#tag/Transaction
 */

export async function prepare(
  currency: CryptoCurrency,
  partyId: string,
  params: PrepareTransferRequest | PrepareTransferInstructionRequest,
) {
  const { data } = await gatewayNetwork<
    PrepareTransferResponse,
    PrepareTransferRequest | PrepareTransferInstructionRequest
  >({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/prepare`,
    data: params,
  });
  return data;
}

export async function prepareTransferRequest(
  currency: CryptoCurrency,
  partyId: string,
  params: PrepareTransferRequest,
) {
  return prepare(currency, partyId, params);
}

export async function prepareTransferInstruction(
  currency: CryptoCurrency,
  partyId: string,
  params: PrepareTransferInstructionRequest,
) {
  return prepare(currency, partyId, params);
}

export async function preparePreApprovalTransaction(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<PrepareTransactionResponse, PrepareTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/prepare`,
    data: {
      type: TransactionType.TRANSFER_PRE_APPROVAL_PROPOSAL,
      receiver: partyId,
    },
  });
  return data;
}

export async function prepareTapRequest(
  currency: CryptoCurrency,
  { partyId, amount = 1000000 }: TapRequest,
) {
  const fixedPointAmount = BigInt(amount) * BigInt(10) ** BigInt(38);

  const { data } = await gatewayNetwork<PrepareTapResponse, { amount: string; type: string }>({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/prepare`,
    data: {
      amount: fixedPointAmount.toString(),
      type: TransactionType.TAP_REQUEST,
    },
  });
  return data;
}

export async function submit(
  currency: CryptoCurrency,
  partyId: string,
  serialized: string,
  signature: string,
) {
  const { data } = await gatewayNetwork<SubmitTransactionResponse, SubmitTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

export async function submitTransferInstruction(
  currency: CryptoCurrency,
  partyId: string,
  serialized: string,
  signature: string,
) {
  return submit(currency, partyId, serialized, signature);
}

export async function submitPreApprovalTransaction(
  currency: CryptoCurrency,
  partyId: string,
  { serialized }: PrepareTransactionResponse,
  signature: string,
) {
  const { data } = await gatewayNetwork<SubmitTransactionResponse, SubmitTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/submit`,
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
  currency: CryptoCurrency,
  { partyId, serialized, signature }: SubmitTapRequestRequest,
) {
  const { data } = await gatewayNetwork<
    SubmitTapRequestResponse,
    Omit<SubmitTapRequestRequest, "partyId">
  >({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}
