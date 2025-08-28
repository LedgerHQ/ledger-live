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

type InstrumentBalance = {
  instrumentId: string;
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
  contractId: string;
  details: string;
};

type CreatedEvent = BaseEvent & {
  templateId: {
    packageId: string;
    moduleName: string;
    entityName: string;
  };
  signatories: string[];
  observers: string[];
};

type ExercisedEvent = BaseEvent & {
  templateId: {
    packageId: string;
    moduleName: string;
    entityName: string;
  };
  choice: string;
  consuming: boolean;
  actingParties: string[];
};

type Event = BaseEvent | CreatedEvent | ExercisedEvent;

type TxInfo = {
  updateId: string;
  commandId: string;
  workflowId: string;
  effectiveAt: Timestamp;
  offset: number;
  synchronizerId: string;
  recordTime: Timestamp;
  events: Event[];
  traceContext: string;
};

const getGatewayUrl = () => coinConfig.getCoinConfig().gatewayUrl;

export async function prepareOnboarding(
  pubKey: string,
  pubKeyType: string,
): Promise<OnboardingPrepareResponse> {
  const { data } = await network<OnboardingPrepareResponse>({
    method: "POST",
    url: `${getGatewayUrl()}/v1/node/0/onboarding/prepare`,
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
    url: `${getGatewayUrl()}/v1/node/0/onboarding/submit`,
    data: {
      prepare_request: prepareRequest,
      prepare_response: prepareResponse,
      signature,
    } satisfies OnboardingSubmitRequest,
  });
  return data;
}

export async function getBalance(partyId: string): Promise<InstrumentBalance[]> {
  const { data } = await network<InstrumentBalance[]>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/0/party/${partyId}/balance`,
  });
  return data;
}

export async function getParty(partyId: string): Promise<PartyInfo> {
  const { data } = await network<PartyInfo>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/0/party/${partyId}`,
  });
  return data;
}

export async function getTransactions(partyId: string): Promise<{
  next: number;
  transactions: TxInfo[];
}> {
  const { data } = await network<{
    next: number;
    transactions: TxInfo[];
  }>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/0/party/${partyId}/transactions`,
  });
  return data;
}

export async function getLedgerEnd(): Promise<number> {
  const { data } = await network<number>({
    method: "GET",
    url: `${getGatewayUrl()}/v1/node/0/ledger-end`,
  });
  return data;
}
