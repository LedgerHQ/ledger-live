import network from "@ledgerhq/live-network";
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

type TransactionSubmitResponse = { updateId: string };

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

export async function prepareOnboarding(
  pubKey: string,
  pubKeyType: string,
): Promise<OnboardingPrepareResponse> {
  const gatewayUrl = getGatewayUrl();
  const nodeId = getNodeId();
  const fullUrl = `${gatewayUrl}/v1/node/${nodeId}/onboarding/prepare`;

  console.log("[Gateway prepareOnboarding] Making request:", {
    gatewayUrl,
    nodeId,
    fullUrl,
    pubKey: pubKey.substring(0, 10) + "...",
    pubKeyType,
  });

  const { data } = await network<OnboardingPrepareResponse>({
    method: "POST",
    url: fullUrl,
    data: {
      public_key: pubKey,
      public_key_type: pubKeyType,
    } satisfies OnboardingPrepareRequest,
  });

  console.log("[Gateway prepareOnboarding] Got response:", {
    partyId: data.party_id,
    partyName: data.party_name,
  });

  return data;
}

export async function submitOnboarding(
  prepareRequest: OnboardingPrepareRequest,
  prepareResponse: OnboardingPrepareResponse,
  signature: string,
) {
  const { data } = await network<OnboardingSubmitResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/onboarding/submit`,
    data: {
      prepare_request: prepareRequest,
      prepare_response: prepareResponse,
      signature,
    } satisfies OnboardingSubmitRequest,
  });
  return data;
}

export async function submit(serializedTx: string, signature: string) {
  const { data } = await network<TransactionSubmitResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/transaction/submit`,
    data: {
      serialized: serializedTx,
      signature,
    } satisfies TransactionSubmitRequest,
  });
  return data;
}

export async function getBalance(partyId: string): Promise<InstrumentBalance[]> {
  const { data } = await network<InstrumentBalance[]>({
    method: "GET",
    // TODO: we need better solution ?
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId.replace(/_/g, ":")}/balance`,
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
  const { data } = await network<PartyInfo>({
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
  const { data } = await network<{
    next: number;
    operations: OperationInfo[];
  }>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId.replace(/_/g, ":")}/operations`,
    data: options,
  });
  return data;
}

type PrepareTapRequestRequest = {
  partyId: string;
  amount: number;
  type: "tap-request";
};

type PrepareTapRequestResponse = {
  serialized: "string";
  json: null;
  hash: "string";
};

export async function prepareTapRequest({
  partyId,
  amount,
  type,
}: PrepareTapRequestRequest): Promise<PrepareTapRequestResponse> {
  const { data } = await network<PrepareTapRequestResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/prepare`,
    data: {
      amount,
      type,
    } satisfies Omit<PrepareTapRequestRequest, "partyId">,
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
  const { data } = await network<SubmitTapRequestResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/submit`,
    data: {
      serialized,
      signature,
    } satisfies Omit<SubmitTapRequestRequest, "partyId">,
  });
  return data;
}

export async function getLedgerEnd(): Promise<number> {
  const { data } = await network<number>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/ledger-end`,
  });
  return data;
}

export async function preparePreApprovalTransaction(
  partyId: string,
): Promise<PrepareTransactionResponse> {
  const { data } = await network<PrepareTransactionResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/prepare`,
    data: {
      type: "transfer-pre-approval-proposal",
      receiver: partyId,
    } satisfies PrepareTransactionRequest,
  });
  return data;
}

export async function submitPreApprovalTransaction(
  partyId: string,
  preparedTransaction: PrepareTransactionResponse,
  signature: string,
): Promise<PreApprovalResult> {
  try {
    const submitRequest: SubmitTransactionRequest = {
      serialized: preparedTransaction.serialized,
      signature,
    };

    console.log("[Gateway submitPreApprovalTransaction] Submit request:", submitRequest);
    console.log(
      "[Gateway submitPreApprovalTransaction] Submit request JSON:",
      JSON.stringify(submitRequest, null, 2),
    );

    const { data } = await network<SubmitTransactionResponse>({
      method: "POST",
      url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transaction/submit`,
      data: submitRequest,
    });

    console.log("[Gateway submitPreApprovalTransaction] Submit response:", data);

    return {
      approved: true,
      transactionId: data.submissionId || `preapproval-${Date.now()}`,
      message: "Transaction pre-approval submitted successfully",
    };
  } catch (error) {
    console.error("[Gateway submitPreApprovalTransaction] Error:", error);
    return {
      approved: false,
      message: error instanceof Error ? error.message : "Failed to submit pre-approval transaction",
    };
  }
}
