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

type OnboardingPrepareResponse = {
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
  amount: number;
  recipient: string;
  execute_before_secs: number;
  instrument_id: string;
  reason?: string | undefined;
};

type OnboardingSubmitRequest = {
  prepare_request: OnboardingPrepareRequest;
  prepare_response: OnboardingPrepareResponse;
  signature: string;
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

export type InstrumentBalance = {
  instrument_id: string;
  amount: number;
  locked: boolean;
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
            type: "pre-approval";
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
        type: "pre-approval";
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
            type: "tap";
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
        type: "tap";
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
            type: "transfer";
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
        type: "transfer";
      };
    };

const getGatewayUrl = () => coinConfig.getCoinConfig().gatewayUrl;
const getNodeId = () => coinConfig.getCoinConfig().nodeId || "ledger-devnet-stg";
const getNetworkType = () => coinConfig.getCoinConfig().networkType;

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

export async function prepareOnboarding(
  pubKey: string,
  pubKeyType: string,
): Promise<OnboardingPrepareResponse> {
  const gatewayUrl = getGatewayUrl();
  const nodeId = getNodeId();
  const fullUrl = `${gatewayUrl}/v1/node/${nodeId}/onboarding/prepare`;

  const { data } = await gatewayNetwork<OnboardingPrepareResponse, OnboardingPrepareRequest>({
    method: "POST",
    url: fullUrl,
    data: {
      public_key: pubKey,
      public_key_type: pubKeyType,
    },
  });

  return data;
}

export async function submitOnboarding(
  prepareRequest: OnboardingPrepareRequest,
  prepareResponse: OnboardingPrepareResponse,
  signature: string,
) {
  const { data } = await gatewayNetwork<OnboardingSubmitResponse, OnboardingSubmitRequest>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/onboarding/submit`,
    data: {
      prepare_request: prepareRequest,
      prepare_response: prepareResponse,
      signature,
    },
  });
  return data;
}

export async function submit(partyId: string, serialized: string, signature: string) {
  const { data } = await gatewayNetwork<TransactionSubmitResponse, TransactionSubmitRequest>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

export async function getBalance(partyId: string): Promise<InstrumentBalance[]> {
  const { data } = await gatewayNetwork<InstrumentBalance[]>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/balance`,
  });
  return data;
}

export async function getPartyById(partyId: string): Promise<PartyInfo> {
  return await getParty(partyId, "party-id");
}

export async function getPartyByPubKey(pubKey: string): Promise<PartyInfo> {
  return await getParty(pubKey, "public-key");
}

async function getParty(identifier: string, by: "party-id" | "public-key"): Promise<PartyInfo> {
  const { data } = await gatewayNetwork<PartyInfo>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${identifier}?by=${by}`,
  });
  return data;
}

export async function getOperations(
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
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/operations`,
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

export async function prepareTapRequest({
  partyId,
  amount = 1000000,
}: PrepareTapRequest): Promise<PrepareTapResponse> {
  if (getNetworkType() === "mainnet") {
    return {
      serialized: "",
      json: null,
      hash: "",
    };
  }
  const { data } = await gatewayNetwork<PrepareTapResponse, { amount: number; type: string }>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/prepare`,
    data: {
      amount: parseInt(amount.toString(), 10), // Convert to integer to avoid scientific notation
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

export async function submitTapRequest({
  partyId,
  serialized,
  signature,
}: SubmitTapRequestRequest): Promise<SubmitTapRequestResponse> {
  const { data } = await gatewayNetwork<
    SubmitTapRequestResponse,
    Omit<SubmitTapRequestRequest, "partyId">
  >({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });
  return data;
}

export async function prepareTransferRequest(
  partyId: string,
  params: PrepareTransferRequest,
): Promise<PrepareTransferResponse> {
  const { data } = await gatewayNetwork<PrepareTransferResponse, PrepareTransferRequest>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/prepare`,
    data: params,
  });
  return data;
}

export async function getLedgerEnd(): Promise<number> {
  const { data } = await gatewayNetwork<number>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/ledger-end`,
  });
  return data;
}

export async function preparePreApprovalTransaction(
  partyId: string,
): Promise<PrepareTransactionResponse> {
  const { data } = await gatewayNetwork<PrepareTransactionResponse, PrepareTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/prepare`,
    data: {
      type: TransactionType.TRANSFER_PRE_APPROVAL_PROPOSAL,
      receiver: partyId,
    },
  });
  return data;
}

export async function submitPreApprovalTransaction(
  partyId: string,
  { serialized }: PrepareTransactionResponse,
  signature: string,
): Promise<PreApprovalResult> {
  const { data } = await gatewayNetwork<SubmitTransactionResponse, SubmitTransactionRequest>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    },
  });

  return {
    isApproved: true,
    submissionId: data.submission_id,
    updateId: data.update_id,
  };
}
