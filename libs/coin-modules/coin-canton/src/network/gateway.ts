import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import coinConfig from "../config";
import {
  PrepareTransactionRequest,
  PrepareTransactionResponse,
  SubmitTransactionRequest,
  SubmitTransactionResponse,
  PreApprovalResult,
} from "../types/onboard";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { CantonSignature } from "../types/signer";

export type OnboardingPrepareResponse = {
  party_id: string;
  party_name: string;
  public_key_fingerprint: string;
  transactions: {
    namespace_transaction: {
      serialized: string;
      json: object;
      hash: string;
    };
    party_to_key_transaction: {
      serialized: string;
      json: object;
      hash: string;
    };
    party_to_participant_transaction: {
      serialized: string;
      json: object;
      hash: string;
    };
    combined_hash: string;
  };
  challenge_nonce?: string;
  challenge_deadline?: number;
};

type OnboardingPrepareRequest = {
  public_key: string;
  public_key_type: string;
};

export type PrepareTransferResponse = {
  hash: string;
  json: any; // The actual structure is complex, using any for now
  serialized: string;
};

export type PrepareTransferRequest = {
  type: "token-transfer-request";
  amount: string;
  recipient: string;
  execute_before_secs: number;
  instrument_id: string;
  reason?: string;
};

export type PrepareTransferInstructionRequest = {
  type:
    | "accept-transfer-instruction"
    | "reject-transfer-instruction"
    | "withdraw-transfer-instruction";
  contract_id: string;
  reason?: string;
};

export type TransferProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: string;
  instrument_id: string;
  memo: string;
  expires_at_micros: number;
};

type OnboardingSubmitRequest = {
  prepare_request: OnboardingPrepareRequest;
  prepare_response: OnboardingPrepareResponse;
  signature: string;
  application_signature?: string;
};

type OnboardingSubmitResponse = {
  party: {
    party_id: string;
    public_key: string;
  };
};

type TransactionSubmitRequest = {
  serialized: string;
  signature: string;
};

type TransactionSubmitResponse = { update_id: string };

export type GetBalanceResponse =
  | {
      at_round: number;
      balances: InstrumentBalance[];
    }
  // temporary backwards compatibility
  | InstrumentBalance[];

export type InstrumentBalance = {
  instrument_id: string;
  amount: string;
  locked: boolean;
  utxo_count: number;
};

type PartyInfo = {
  party_id: string;
  public_key: string;
};

type Timestamp = {
  seconds: number;
  nanos: number;
};

type BaseEvent = {
  type: string;
  contract_id: string;
  details: string;
};

export type CreatedEvent = BaseEvent & {
  template_id: {
    package_id: string;
    module_name: string;
    entity_name: string;
  };
  signatories: string[];
  observers: string[];
  details: {
    createArguments: { fields: unknown[] };
  };
};

type ExercisedEvent = BaseEvent & {
  template_id: {
    packageId: string;
    moduleName: string;
    entityName: string;
  };
  choice: string;
  consuming: boolean;
  acting_parties: string[];
};

type Event = BaseEvent | CreatedEvent | ExercisedEvent;

export type TxInfo = {
  update_id: string;
  command_id: string;
  workflow_id: string;
  effective_at: Timestamp;
  offset: number;
  synchronizer_id: string;
  record_time: Timestamp;
  events: Record<string, Event>[];
  trace_context: string;
};

type OperationType =
  | "pre-approval"
  | "tap"
  | "transfer"
  | "transfer-proposal"
  | "transfer-rejected"
  | "transfer-withdrawn";

export type OperationInfo =
  | {
      uid: string;
      transaction_hash: string;
      transaction_timestamp: string;
      status: "Success";
      type: "Initialize";
      senders: string[];
      recipients: string[];
      transfers: [
        {
          address: string;
          type: "Initialize";
          value: string;
          asset: string;
          details: {
            operationType: OperationType;
            metadata: {
              reason?: string;
            };
          };
        },
      ];
      block: {
        height: number;
        time: string;
        hash: string;
      };
      fee: {
        value: string;
        asset: {
          type: "native";
          issuer: null;
        };
        details: {
          type: string;
        };
      };
      asset: {
        type: "token";
        issuer: string;
      };
      details: {
        operationType: OperationType;
      };
    }
  | {
      uid: string;
      transaction_hash: string;
      transaction_timestamp: string;
      status: "Success";
      type: "Receive";
      senders: string[];
      recipients: string[];
      transfers: [
        {
          address: string;
          type: "Receive";
          value: string;
          asset: string;
          details: {
            operationType: OperationType;
            metadata: {
              reason?: string;
            };
          };
        },
      ];
      block: {
        height: number;
        time: string;
        hash: string;
      };
      fee: {
        value: string;
        asset: {
          type: "native";
          issuer: null;
        };
        details: {
          type: string;
        };
      };
      asset: {
        type: "native";
        issuer: null;
      };
      details: {
        operationType: OperationType;
      };
    }
  | {
      uid: string;
      transaction_hash: string;
      transaction_timestamp: string;
      status: "Success";
      type: "Send";
      senders: string[];
      recipients: string[];
      transfers: [
        {
          address: string;
          type: "Send";
          value: string;
          asset: string;
          details: {
            operationType: OperationType;
            metadata: {
              reason?: string;
            };
          };
        },
      ];
      block: {
        height: number;
        time: string;
        hash: string;
      };
      fee: {
        value: string;
        asset: {
          type: "native";
          issuer: null;
        };
        details: {
          type: string;
        };
      };
      asset: {
        type: "native";
        issuer: null;
      };
      details: {
        operationType: OperationType;
      };
    };

const getGatewayUrl = (currency: CryptoCurrency) => coinConfig.getCoinConfig(currency).gatewayUrl;
const getNodeId = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).nodeId || "ledger-live-devnet";
export const getNetworkType = (currency: CryptoCurrency) =>
  coinConfig.getCoinConfig(currency).networkType;

const gatewayNetwork = <T, U = unknown>(req: LiveNetworkRequest<U>) => {
  const API_KEY = getEnv("CANTON_API_KEY");
  return network<T, U>({
    ...req,
    headers: {
      ...(req.headers || {}),
      ...(API_KEY && { "X-Ledger-Canton-Api-Key": API_KEY }),
    },
  });
};

export async function prepareOnboarding(currency: CryptoCurrency, pubKey: string) {
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

type OnboardingSubmitError409 = {
  partyId: string;
  status: 409;
  type: "PARTY_ALREADY_EXISTS";
  message: string;
};

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
  } catch (e) {
    if (e instanceof Error && "type" in e && e.type === "PARTY_ALREADY_EXISTS") {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const { partyId } = e as unknown as OnboardingSubmitError409;
      return {
        party: {
          party_id: partyId,
          public_key: publicKey,
        },
      };
    }

    throw e;
  }
}

export async function submit(
  currency: CryptoCurrency,
  partyId: string,
  serialized: string,
  signature: string,
) {
  const { data } = await gatewayNetwork<TransactionSubmitResponse, TransactionSubmitRequest>({
    method: "POST",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

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

export async function getBalance(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<GetBalanceResponse>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/balance`,
  });
  return Array.isArray(data) ? data : data.balances;
}

export async function getPartyById(currency: CryptoCurrency, partyId: string): Promise<PartyInfo> {
  return await getParty(currency, partyId, "party-id");
}

export async function getPartyByPubKey(
  currency: CryptoCurrency,
  pubKey: string,
): Promise<PartyInfo> {
  return await getParty(currency, pubKey, "public-key");
}

async function getParty(
  currency: CryptoCurrency,
  identifier: string,
  by: "party-id" | "public-key",
): Promise<PartyInfo> {
  const { data } = await gatewayNetwork<PartyInfo>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${identifier}?by=${by}`,
  });
  return data;
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
  operations: OperationInfo[];
}> {
  const { data } = await gatewayNetwork<{
    next: number;
    operations: OperationInfo[];
  }>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/operations`,
    params: options,
  });
  return data;
}

type PrepareTapRequest = {
  partyId: string;
  amount?: number;
};

type PrepareTapResponse = {
  serialized: string;
  json: null;
  hash: string;
};

enum TransactionType {
  TAP_REQUEST = "tap-request",
  TRANSFER_PRE_APPROVAL_PROPOSAL = "transfer-pre-approval-proposal",
}

export async function prepareTapRequest(
  currency: CryptoCurrency,
  { partyId, amount = 1000000 }: PrepareTapRequest,
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

type SubmitTapRequestRequest = {
  partyId: string;
  serialized: string;
  signature: string;
};

type SubmitTapRequestResponse = {
  submission_id: string;
  update_id: string;
};

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

export async function getLedgerEnd(currency: CryptoCurrency): Promise<number> {
  const { data } = await gatewayNetwork<number>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/ledger-end`,
  });
  return data;
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

export async function submitTransferInstruction(
  currency: CryptoCurrency,
  partyId: string,
  serialized: string,
  signature: string,
) {
  return submit(currency, partyId, serialized, signature);
}

type GetTransferPreApprovalResponse = {
  contract_id: string;
  receiver: string;
  provider: string;
  valid_from: string; // ISO 8601 date string
  last_renewed_at: string; // ISO 8601 date
  expires_at: string; // ISO 8601 date string
};

export async function getTransferPreApproval(currency: CryptoCurrency, partyId: string) {
  const { data } = await gatewayNetwork<GetTransferPreApprovalResponse>({
    method: "GET",
    url: `${getGatewayUrl(currency)}/v1/node/${getNodeId(currency)}/party/${partyId}/transfer-preapproval`,
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
