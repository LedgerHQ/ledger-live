import network from "@ledgerhq/live-network";
import coinConfig from "../config";

type OnboardingPrepareResponse = {
  party_id: string;
  party_name: string;
  public_key_fingerprint: string;
  topology_transactions_hash: string;
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

const getGatewayUrl = () => coinConfig.getCoinConfig().gatewayUrl;
const getNodeId = () => coinConfig.getCoinConfig().nodeId || "ledger-live-devnet-prd";

export async function prepareOnboarding(
  pubKey: string,
  pubKeyType: string,
): Promise<OnboardingPrepareResponse> {
  const { data } = await network<OnboardingPrepareResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/onboarding/prepare`,
    data: {
      public_key: pubKey,
      public_key_type: pubKeyType,
    } satisfies OnboardingPrepareRequest,
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
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/balance`,
  });
  return data;
}

export async function getPartyById(partyId: string): Promise<PartyInfo> {
  return await getParty(partyId, "ID");
}

export async function getPartyByPubKey(pubKey: string): Promise<PartyInfo> {
  return await getParty(pubKey, "PK");
}

async function getParty(identifier: string, by: "ID" | "PK"): Promise<PartyInfo> {
  const { data } = await network<PartyInfo>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${identifier}`,
    data: {
      by,
    },
  });
  return data;
}

export async function getTransactions(
  partyId: string,
  options?: {
    cursor?: number | undefined;
    minOffset?: number | undefined;
    maxOffset?: number | undefined;
    limit?: number | undefined;
  },
): Promise<{
  next: number;
  transactions: TxInfo[];
}> {
  const { data } = await network<{
    next: number;
    transactions: TxInfo[];
  }>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/${getNodeId()}/party/${partyId}/transactions`,
    data: options,
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
