import network from "@ledgerhq/live-network";
import { LedgerAPI4xx } from "@ledgerhq/live-network/errors";
import type { CantonCoinConfig, CantonContext } from "../config";
import {
  createMockCantonCurrency,
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
  createMockOnboardingPrepareResponse,
  createMockPendingTransferProposal,
} from "../test/fixtures";
import {
  CantonInvalidConfigError,
  TopologyChangeError,
  TransferOfferExpiredError,
} from "../types/errors";
import type { GetBalanceResponse } from "../types/gateway";
import { TransactionType } from "../types/gateway";
import {
  clearDsoPartyIdCache,
  clearEnabledInstrumentsCache,
  clearIsTopologyChangeRequiredCache,
  getBalance,
  getCalTokensCached,
  getDsoPartyIdCached,
  getEnabledInstruments,
  getEnabledInstrumentsCached,
  getEnabledInstrumentsStrictCached,
  getLedgerEnd,
  getNativeInstrument,
  getNodeId,
  getNodeInfo,
  getOperations,
  getPartyById,
  getPartyByIdCached,
  getPartyByPubKey,
  getPendingTransferProposals,
  getTransferPreApproval,
  isGatewayEnabled,
  isPartyAlreadyExists,
  isPartyNotFound,
  isPartyNotFoundByPublicKey,
  isTopologyChangeRequired,
  isTopologyChangeRequiredCached,
  isTransferOfferExpired,
  prepare,
  prepareOnboarding,
  preparePreApprovalTransaction,
  prepareTapRequest,
  prepareTransferInstruction,
  prepareTransferRequest,
  submit,
  submitOnboarding,
  submitPreApprovalTransaction,
  submitTapRequest,
  submitTransferInstruction,
  DEFAULT_TAP_REQUEST_AMOUNT,
  type InstrumentsResponse,
} from "./gateway";

jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => {
    if (key === "CAL_SERVICE_URL") return "https://cal.example.com";
    return undefined;
  }),
}));

const logger = jest.fn();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ctx = (config: CantonCoinConfig): CantonContext => ({ ...createMockContext(config), logger });

const createTestNodeConfig = (): CantonCoinConfig => ({
  ...createMockCoinConfigValue(),
  nodeId: "test-node-id",
});

const mockBalances = createMockInstrumentBalances(2, [
  {
    admin_id: "AmuletAdmin",
    instrument_id: "Amulet",
    amount: "10000000000000000000000000000000000000000",
    locked: false,
    utxo_count: 1,
  },
  {
    admin_id: "LockedAmuletAdmin",
    instrument_id: "Amulet",
    amount: "5000000000000000000000000000000000000000",
    locked: true,
    utxo_count: 1,
  },
]);

describe("isPartyNotFoundByPublicKey", () => {
  it("matches the gateway's unknown public key message", () => {
    expect(
      isPartyNotFoundByPublicKey(new Error('Party with public key "abab" does not exist')),
    ).toBe(true);
  });

  it("does not match other party errors", () => {
    expect(isPartyNotFoundByPublicKey(new Error("Party not found"))).toBe(false);
    expect(isPartyNotFoundByPublicKey(new Error('Party with id "x" already exists'))).toBe(false);
    expect(isPartyNotFoundByPublicKey("Party with public key does not exist")).toBe(false);
  });
});

describe("isPartyNotFound", () => {
  it("returns true for party not found message (spaces)", () => {
    expect(isPartyNotFound(new Error("Party not found"))).toBe(true);
  });

  it("returns true for party_not_found (underscores normalized)", () => {
    expect(isPartyNotFound(new Error("party_not_found"))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isPartyNotFound(new Error("PARTY NOT FOUND"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isPartyNotFound(new Error("Network timeout"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isPartyNotFound("string")).toBe(false);
    expect(isPartyNotFound(null)).toBe(false);
  });
});

describe("isPartyAlreadyExists", () => {
  it("returns true for party already exists (spaces)", () => {
    expect(isPartyAlreadyExists(new Error("Party already exists"))).toBe(true);
  });

  it("returns true for party_already_exists (underscores normalized)", () => {
    expect(isPartyAlreadyExists(new Error("party_already_exists"))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isPartyAlreadyExists(new Error("PARTY ALREADY EXISTS"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isPartyAlreadyExists(new Error("not found"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isPartyAlreadyExists(undefined)).toBe(false);
  });
});

describe("isTransferOfferExpired", () => {
  it("returns true for the gateway expiry message", () => {
    expect(isTransferOfferExpired(new Error("transfer offer has expired"))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isTransferOfferExpired(new Error("Transfer offer has expired"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isTransferOfferExpired(new Error("An internal server occurred"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isTransferOfferExpired("transfer offer has expired")).toBe(false);
  });
});

describe("getPartyById and getPartyByPubKey", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPartyById calls GET with by=party-id and returns party", async () => {
    const party = { party_id: "p1", public_key: "pk1" };
    mockNetwork.mockResolvedValue({ data: party, status: 200 });

    const result = await getPartyById(ctx(mockConfig), "p1");

    expect(result).toEqual(party);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/party/p1?by=party-id"),
      }),
    );
  });

  it("getPartyByPubKey calls GET with by=public-key and returns party", async () => {
    const party = { party_id: "p1", public_key: "abc123" };
    mockNetwork.mockResolvedValue({ data: party, status: 200 });

    const result = await getPartyByPubKey(ctx(mockConfig), "abc123");

    expect(result).toEqual(party);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/party/abc123?by=public-key"),
      }),
    );
  });

  it("throws TopologyChangeError when party is not found", async () => {
    mockNetwork.mockRejectedValue(new Error("Party not found"));

    await expect(getPartyById(ctx(mockConfig), "missing")).rejects.toThrow(TopologyChangeError);
  });
});

describe("prepareOnboarding", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POSTs public_key and public_key_type ed25519 to onboarding/prepare", async () => {
    const prepared = createMockOnboardingPrepareResponse();
    mockNetwork.mockResolvedValue({ data: prepared, status: 200 });

    const result = await prepareOnboarding(ctx(mockConfig), "pk-hex");

    expect(result).toEqual(prepared);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/onboarding/prepare"),
        data: {
          public_key: "pk-hex",
          public_key_type: "ed25519",
        },
      }),
    );
  });

  it("rethrows errors that are not party already exists", async () => {
    mockNetwork.mockRejectedValue(new Error("Gateway down"));

    await expect(prepareOnboarding(ctx(mockConfig), "pk")).rejects.toThrow("Gateway down");
  });
});

describe("submitOnboarding", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;
  const prepareResponse = createMockOnboardingPrepareResponse();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns party on success without application_signature in body when omitted", async () => {
    const submitResponse = {
      party: { party_id: "pid", public_key: "pk" },
    };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submitOnboarding(ctx(mockConfig), "pk", prepareResponse, {
      signature: "sig",
    });

    expect(result).toEqual(submitResponse);
    const call = mockNetwork.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data).not.toHaveProperty("application_signature");
  });

  it("includes application_signature when provided", async () => {
    const submitResponse = {
      party: { party_id: "pid", public_key: "pk" },
    };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    await submitOnboarding(ctx(mockConfig), "pk", prepareResponse, {
      signature: "sig",
      applicationSignature: "app-sig",
    });

    const call = mockNetwork.mock.calls[0][0] as { data: { application_signature?: string } };
    expect(call.data.application_signature).toBe("app-sig");
  });
});

describe("isTopologyChangeRequired", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when prepareOnboarding returns a response", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await expect(isTopologyChangeRequired(ctx(mockConfig), "pk")).resolves.toBe(true);
  });

  it("returns false when prepare response is falsy", async () => {
    mockNetwork.mockResolvedValue({ data: undefined, status: 200 });

    await expect(isTopologyChangeRequired(ctx(mockConfig), "pk")).resolves.toBe(false);
  });

  it("returns false on party already exists", async () => {
    mockNetwork.mockRejectedValue(new Error("Party already exists"));

    await expect(isTopologyChangeRequired(ctx(mockConfig), "pk")).resolves.toBe(false);
  });

  it("rethrows other errors", async () => {
    mockNetwork.mockRejectedValue(new Error("Service unavailable"));

    await expect(isTopologyChangeRequired(ctx(mockConfig), "pk")).rejects.toThrow(
      "Service unavailable",
    );
  });
});

describe("isTopologyChangeRequiredCached", () => {
  const mockConfig = createTestNodeConfig();
  const gatewayA = { ...mockConfig, gatewayUrl: "https://gateway-a.example.com" };
  const gatewayB = { ...mockConfig, gatewayUrl: "https://gateway-b.example.com" };
  const pubKey = "test-pub-key";
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all(
      [mockConfig, gatewayA, gatewayB].map(config =>
        clearIsTopologyChangeRequiredCache(ctx(config), pubKey),
      ),
    );
  });

  it("caches result per gateway, node and pubKey", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await expect(isTopologyChangeRequiredCached(ctx(mockConfig), pubKey)).resolves.toBe(true);
    await expect(isTopologyChangeRequiredCached(ctx(mockConfig), pubKey)).resolves.toBe(true);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("fetches again after clearIsTopologyChangeRequiredCache", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await isTopologyChangeRequiredCached(ctx(mockConfig), pubKey);
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    await clearIsTopologyChangeRequiredCache(ctx(mockConfig), pubKey);
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await isTopologyChangeRequiredCached(ctx(mockConfig), pubKey);
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("does not reuse a verdict cached for another gateway with the same node id", async () => {
    mockNetwork
      .mockRejectedValueOnce(new Error("Party already exists"))
      .mockResolvedValueOnce({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await expect(isTopologyChangeRequiredCached(ctx(gatewayA), pubKey)).resolves.toBe(false);
    await expect(isTopologyChangeRequiredCached(ctx(gatewayB), pubKey)).resolves.toBe(true);
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("clears only the entry of the gateway it is given", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });
    await isTopologyChangeRequiredCached(ctx(gatewayA), pubKey);
    await isTopologyChangeRequiredCached(ctx(gatewayB), pubKey);

    await clearIsTopologyChangeRequiredCache(ctx(gatewayA), pubKey);
    await isTopologyChangeRequiredCached(ctx(gatewayA), pubKey);
    await isTopologyChangeRequiredCached(ctx(gatewayB), pubKey);

    expect(mockNetwork).toHaveBeenCalledTimes(3);
    expect(mockNetwork).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: expect.stringContaining(gatewayA.gatewayUrl) }),
    );
  });
});

describe("getPartyByIdCached", () => {
  const mockNetwork = network as jest.MockedFunction<typeof network>;
  const party = { party_id: "cached-party", public_key: "pk" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNetwork.mockResolvedValue({ data: party, status: 200 });
  });

  it("caches the party per gateway, node and party id", async () => {
    const config = { ...createTestNodeConfig(), gatewayUrl: "https://gateway-a.example.com" };

    await expect(getPartyByIdCached(ctx(config), "cached-party")).resolves.toEqual(party);
    await expect(getPartyByIdCached(ctx(config), "cached-party")).resolves.toEqual(party);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("does not reuse a party cached for another gateway with the same node id", async () => {
    const config = createTestNodeConfig();
    await getPartyByIdCached(ctx({ ...config, gatewayUrl: "https://gateway-b.example.com" }), "p");
    await getPartyByIdCached(ctx({ ...config, gatewayUrl: "https://gateway-c.example.com" }), "p");

    expect(mockNetwork).toHaveBeenCalledTimes(2);
    expect(mockNetwork).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: expect.stringContaining("https://gateway-c.example.com") }),
    );
  });
});

describe("getNodeInfo and getNativeInstrument", () => {
  const mockNetwork = network as jest.MockedFunction<typeof network>;
  const DSO = "DSO::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc";
  const nodeInfo = { validator_id: "validator::1220", dso_id: DSO };

  beforeEach(() => {
    jest.clearAllMocks();
    getDsoPartyIdCached.reset();
    mockNetwork.mockResolvedValue({ data: nodeInfo, status: 200 });
  });

  it("reads the node info of the configured node", async () => {
    const config = createTestNodeConfig();

    await expect(getNodeInfo(ctx(config))).resolves.toEqual(nodeInfo);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: `${config.gatewayUrl}/v1/node/test-node-id`,
      }),
    );
  });

  it("pairs the configured native instrument id with the node's DSO party", async () => {
    await expect(getNativeInstrument(ctx(createTestNodeConfig()))).resolves.toEqual({
      instrumentId: "Amulet",
      instrumentAdmin: DSO,
    });
  });

  it("caches the DSO party per gateway and node", async () => {
    const config = createTestNodeConfig();

    await getNativeInstrument(ctx(config));
    await getNativeInstrument(ctx(config));
    await getNativeInstrument(ctx({ ...config, gatewayUrl: "https://gateway-b.example.com" }));

    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("reads the DSO party again after clearDsoPartyIdCache, for that gateway and node only", async () => {
    const config = createTestNodeConfig();
    const gatewayB = { ...config, gatewayUrl: "https://gateway-b.example.com" };
    await getNativeInstrument(ctx(config));
    await getNativeInstrument(ctx(gatewayB));
    mockNetwork.mockResolvedValue({
      data: { ...nodeInfo, dso_id: "DSO::after-reset" },
      status: 200,
    });

    await clearDsoPartyIdCache(ctx(config));

    await expect(getNativeInstrument(ctx(config))).resolves.toEqual({
      instrumentId: "Amulet",
      instrumentAdmin: "DSO::after-reset",
    });
    await expect(getNativeInstrument(ctx(gatewayB))).resolves.toEqual({
      instrumentId: "Amulet",
      instrumentAdmin: DSO,
    });
  });

  it("rejects node info without a DSO party instead of matching no native holding", async () => {
    mockNetwork.mockResolvedValue({ data: { validator_id: "validator::1220" }, status: 200 });

    await expect(getNativeInstrument(ctx(createTestNodeConfig()))).rejects.toThrow("no DSO party");
  });
});

describe("getLedgerEnd, getOperations, getPendingTransferProposals, getTransferPreApproval", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getLedgerEnd returns numeric ledger end", async () => {
    mockNetwork.mockResolvedValue({ data: 42, status: 200 });

    await expect(getLedgerEnd(ctx(mockConfig))).resolves.toBe(42);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/ledger-end"),
      }),
    );
  });

  it("getOperations returns next and operations and passes params", async () => {
    const payload = { next: 1, operations: [] };
    mockNetwork.mockResolvedValue({ data: payload, status: 200 });

    const result = await getOperations(ctx(mockConfig), "party-1", { cursor: 1, limit: 10 });

    expect(result).toEqual(payload);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/party/party-1/operations"),
        params: { cursor: 1, limit: 10 },
      }),
    );
  });

  it("getPendingTransferProposals returns proposals array", async () => {
    const proposals = [createMockPendingTransferProposal()];
    mockNetwork.mockResolvedValue({ data: proposals, status: 200 });

    const result = await getPendingTransferProposals(ctx(mockConfig), "party-1");

    expect(result).toEqual(proposals);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringMatching(/\/party\/party-1\/transfer-proposals\?timestamp=\d+/),
      }),
    );
  });

  it("getTransferPreApproval returns pre-approval payload", async () => {
    const preApproval = {
      contract_id: "c1",
      receiver: "r1",
      provider: "p1",
      valid_from: "2020-01-01T00:00:00Z",
      last_renewed_at: "2020-01-01T00:00:00Z",
      expires_at: "2025-01-01T00:00:00Z",
    };
    mockNetwork.mockResolvedValue({ data: preApproval, status: 200 });

    const result = await getTransferPreApproval(ctx(mockConfig), "party-1");

    expect(result).toEqual(preApproval);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/party/party-1/transfer-preapproval"),
      }),
    );
  });
});

describe("prepare and submit transaction helpers", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const prepareResponse = {
    serialized: "ser",
    json: {},
    hash: "h",
    step: { type: "single-step" as const },
  };

  it("prepare POSTs to transaction/prepare", async () => {
    mockNetwork.mockResolvedValue({ data: prepareResponse, status: 200 });

    const params = {
      type: "token-transfer-request" as const,
      recipient: "bob",
      amount: "1",
      instrument_id: "Amulet",
      execute_before_secs: 3600,
    };

    const result = await prepare(ctx(mockConfig), "party-1", params);

    expect(result).toEqual(prepareResponse);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/party/party-1/transaction/prepare"),
        data: params,
      }),
    );
  });

  it("prepareTransferRequest delegates to prepare", async () => {
    mockNetwork.mockResolvedValue({ data: prepareResponse, status: 200 });

    const params = {
      type: "token-transfer-request" as const,
      recipient: "bob",
      amount: "1",
      instrument_id: "Amulet",
      execute_before_secs: 3600,
    };

    await prepareTransferRequest(ctx(mockConfig), "party-1", params);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: params,
      }),
    );
  });

  it("prepareTransferInstruction delegates to prepare", async () => {
    mockNetwork.mockResolvedValue({ data: prepareResponse, status: 200 });

    const params = {
      type: "accept-transfer-instruction" as const,
      contract_id: "cid",
    };

    await prepareTransferInstruction(ctx(mockConfig), "party-1", params);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: params,
      }),
    );
  });

  it("prepareTransferInstruction throws TransferOfferExpiredError when the offer has expired", async () => {
    mockNetwork.mockRejectedValue(new LedgerAPI4xx("transfer offer has expired", { status: 400 }));

    await expect(
      prepareTransferInstruction(ctx(mockConfig), "party-1", {
        type: "accept-transfer-instruction",
        contract_id: "cid",
      }),
    ).rejects.toThrow(TransferOfferExpiredError);
  });

  it("prepareTransferInstruction rethrows other gateway errors unchanged", async () => {
    const serverError = new Error("An internal server occurred");
    mockNetwork.mockRejectedValue(serverError);

    await expect(
      prepareTransferInstruction(ctx(mockConfig), "party-1", {
        type: "accept-transfer-instruction",
        contract_id: "cid",
      }),
    ).rejects.toBe(serverError);
  });

  it("preparePreApprovalTransaction sends transfer-pre-approval-proposal", async () => {
    const preApprovalPrepare = {
      serialized: "s",
      json: {},
      hash: "hash",
    };
    mockNetwork.mockResolvedValue({ data: preApprovalPrepare, status: 200 });

    const result = await preparePreApprovalTransaction(ctx(mockConfig), "party-1");

    expect(result).toEqual(preApprovalPrepare);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        data: {
          type: TransactionType.TRANSFER_PRE_APPROVAL_PROPOSAL,
          receiver: "party-1",
        },
      }),
    );
  });

  it("prepareTapRequest uses default fixed-point amount when amount omitted", async () => {
    const tapPrepare = {
      serialized: "s",
      json: null,
      hash: "h",
      step: { type: "single-step" as const },
    };
    mockNetwork.mockResolvedValue({ data: tapPrepare, status: 200 });

    const result = await prepareTapRequest(ctx(mockConfig), { partyId: "party-1" });

    expect(result).toEqual(tapPrepare);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          amount: DEFAULT_TAP_REQUEST_AMOUNT,
          type: TransactionType.TAP_REQUEST,
        },
      }),
    );
  });

  it("prepareTapRequest uses provided amount string", async () => {
    const tapPrepare = {
      serialized: "s",
      json: null,
      hash: "h",
      step: { type: "single-step" as const },
    };
    mockNetwork.mockResolvedValue({ data: tapPrepare, status: 200 });

    await prepareTapRequest(ctx(mockConfig), { partyId: "party-1", amount: "1000" });

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          amount: "1000",
          type: TransactionType.TAP_REQUEST,
        },
      }),
    );
  });

  it("prepareTapRequest preserves explicit zero amount", async () => {
    const tapPrepare = {
      serialized: "s",
      json: null,
      hash: "h",
      step: { type: "single-step" as const },
    };
    mockNetwork.mockResolvedValue({ data: tapPrepare, status: 200 });

    await prepareTapRequest(ctx(mockConfig), { partyId: "party-1", amount: "0" });

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          amount: "0",
          type: TransactionType.TAP_REQUEST,
        },
      }),
    );
  });

  it("submit POSTs serialized and signature", async () => {
    const submitResponse = { submission_id: "sub", update_id: "upd" };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submit(ctx(mockConfig), "party-1", "ser-hex", "sig-hex");

    expect(result).toEqual(submitResponse);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/party/party-1/transaction/submit"),
        data: { serialized: "ser-hex", signature: "sig-hex" },
      }),
    );
  });

  it("submitTransferInstruction delegates to submit", async () => {
    const submitResponse = { submission_id: "sub", update_id: "upd" };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submitTransferInstruction(ctx(mockConfig), "party-1", "ser", "sig");

    expect(result).toEqual(submitResponse);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("submitPreApprovalTransaction returns PreApprovalResult", async () => {
    const submitResponse = { submission_id: "sub1", update_id: "upd1" };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submitPreApprovalTransaction(
      ctx(mockConfig),
      "party-1",
      { serialized: "ser", json: {}, hash: "h" },
      "sig",
    );

    expect(result).toEqual({
      isApproved: true,
      submissionId: "sub1",
      updateId: "upd1",
    });
  });

  it("submitTapRequest POSTs tap submit payload", async () => {
    const tapSubmit = { submission_id: "s", update_id: "u" };
    mockNetwork.mockResolvedValue({ data: tapSubmit, status: 200 });

    const result = await submitTapRequest(ctx(mockConfig), {
      partyId: "party-1",
      serialized: "ser",
      signature: "sig",
    });

    expect(result).toEqual(tapSubmit);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/party/party-1/transaction/submit"),
        data: { serialized: "ser", signature: "sig" },
      }),
    );
  });
});

describe("getCalTokensCached", () => {
  const mockCurrency = createMockCantonCurrency();
  const calConfig = createMockCoinConfigValue();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
    getCalTokensCached.clear(mockCurrency.id);
  });

  it("maps token id to token_identifier and caches", async () => {
    const calTokens = [
      {
        id: "tok1",
        name: "T",
        ticker: "T",
        network: "canton_network",
        contract_address: "0x0",
        token_identifier: "ident1",
      },
    ];
    mockNetwork.mockResolvedValue({ data: calTokens, status: 200 });

    const map1 = await getCalTokensCached(ctx(calConfig), mockCurrency.id);
    const map2 = await getCalTokensCached(ctx(calConfig), mockCurrency.id);

    expect(map1.get("tok1")).toBe("ident1");
    expect(map2.get("tok1")).toBe("ident1");
    expect(mockNetwork).toHaveBeenCalledTimes(1);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/v1/tokens?network=canton_network"),
      }),
    );
  });

  it("fetches again after cache clear", async () => {
    const calTokens = [
      {
        id: "tok1",
        name: "T",
        ticker: "T",
        network: "canton_network",
        contract_address: "0x0",
        token_identifier: "ident1",
      },
    ];
    mockNetwork.mockResolvedValue({ data: calTokens, status: 200 });

    await getCalTokensCached(ctx(calConfig), mockCurrency.id);
    getCalTokensCached.clear(mockCurrency.id);
    mockNetwork.mockResolvedValue({
      data: [{ ...calTokens[0], token_identifier: "ident2" }],
      status: 200,
    });

    const map = await getCalTokensCached(ctx(calConfig), mockCurrency.id);
    expect(map.get("tok1")).toBe("ident2");
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});

describe("getBalance", () => {
  const mockConfig = createMockCoinConfigValue();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an array of balances (backwards compatibility)", async () => {
    mockNetwork.mockResolvedValue({ data: mockBalances, status: 200 });
    const result = await getBalance(ctx(mockConfig), "test-party-id");

    expect(result).toEqual(mockBalances);
  });

  it("should return an object with balances property", async () => {
    const mockResponse: GetBalanceResponse = {
      at_round: 123,
      balances: mockBalances,
    };

    mockNetwork.mockResolvedValue({ data: mockResponse, status: 200 });
    const result = await getBalance(ctx(mockConfig), "test-party-id");

    expect(result).toEqual(mockResponse.balances);
  });

  it("should handle PARTY_ALREADY_EXISTS error", async () => {
    const error = new LedgerAPI4xx("Party already exists", {
      status: 409,
      url: undefined,
      method: "POST",
    });
    const mockPublicKey = "test-public-key";

    const mockPrepareResponse = createMockOnboardingPrepareResponse();

    mockNetwork.mockRejectedValue(error);

    const result = await submitOnboarding(ctx(mockConfig), mockPublicKey, mockPrepareResponse, {
      signature: "test-signature",
    });

    expect(isPartyAlreadyExists(error)).toBe(true);
    expect(result.party).toEqual({ party_id: "test-party-id", public_key: mockPublicKey });
  });

  it("should handle PARTY_NOT_FOUND_BY_ID error", async () => {
    const partyNotFoundError = new LedgerAPI4xx("Party not found", {
      status: 400,
      url: undefined,
      method: "GET",
    });
    mockNetwork.mockRejectedValue(partyNotFoundError);

    await expect(getBalance(ctx(mockConfig), "test-party-id")).rejects.toThrow(TopologyChangeError);
  });
});

describe("getEnabledInstruments", () => {
  const mockConfig = createTestNodeConfig();

  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return enabled instruments from API", async () => {
    const mockInstrumentsResponse: InstrumentsResponse = [
      { id: "Amulet", admin: "admin1" },
      { id: "0x1234567890abcdef", admin: "admin2" },
      { id: "0xabcdef1234567890", admin: "admin3" },
    ];

    mockNetwork.mockResolvedValue({ data: mockInstrumentsResponse, status: 200 });

    const result = await getEnabledInstruments(ctx(mockConfig));

    expect(result).toEqual(
      new Set(["Amulet____admin1", "0x1234567890abcdef____admin2", "0xabcdef1234567890____admin3"]),
    );
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/v1/node/test-node-id/instruments"),
      }),
    );
  });

  it("should return empty Set on API failure (fail-safe) and log the message only", async () => {
    const error = Object.assign(new Error("Network error"), {
      config: { headers: { "X-Ledger-Canton-Api-Key": "secret" } },
    });
    mockNetwork.mockRejectedValue(error);

    const result = await getEnabledInstruments(ctx(mockConfig));

    expect(result).toEqual(new Set());
    expect(logger).toHaveBeenCalledWith("canton/gateway", "Failed to fetch enabled instruments", {
      error: "Network error",
    });
  });

  it("should reject on an invalid config rather than return an empty Set", async () => {
    const config = { ...mockConfig, gatewayUrl: "" };

    await expect(getEnabledInstruments(ctx(config))).rejects.toThrow(CantonInvalidConfigError);
    expect(mockNetwork).not.toHaveBeenCalled();
    expect(logger).not.toHaveBeenCalled();
  });

  it("should return empty Set when API returns empty instruments list", async () => {
    const mockEmptyResponse: InstrumentsResponse = [];

    mockNetwork.mockResolvedValue({ data: mockEmptyResponse, status: 200 });

    const result = await getEnabledInstruments(ctx(mockConfig));

    expect(result).toEqual(new Set());
  });

  it("should handle malformed API response gracefully", async () => {
    // API returns data that is not an array
    mockNetwork.mockResolvedValue({ data: { invalid: "response" }, status: 200 });

    const result = await getEnabledInstruments(ctx(mockConfig));

    expect(result).toEqual(new Set());
    expect(logger).toHaveBeenCalled();
  });
});

describe("getEnabledInstrumentsStrictCached", () => {
  const mockConfig = createTestNodeConfig();
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearEnabledInstrumentsCache(ctx(mockConfig));
  });

  it("rejects on a failed read and reads again on the next call", async () => {
    const outage = new Error("Network error");
    mockNetwork.mockRejectedValueOnce(outage);
    await expect(getEnabledInstrumentsStrictCached(ctx(mockConfig))).rejects.toThrow(
      outage.message,
    );

    mockNetwork.mockResolvedValueOnce({ data: [{ id: "Amulet", admin: "admin1" }], status: 200 });
    await expect(getEnabledInstrumentsStrictCached(ctx(mockConfig))).resolves.toEqual(
      new Set(["Amulet____admin1"]),
    );
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});

describe("getEnabledInstrumentsCached", () => {
  const mockConfig = createTestNodeConfig();
  const gatewayA = { ...mockConfig, gatewayUrl: "https://gateway-a.example.com" };
  const gatewayB = { ...mockConfig, gatewayUrl: "https://gateway-b.example.com" };

  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all(
      [mockConfig, gatewayA, gatewayB].map(config => clearEnabledInstrumentsCache(ctx(config))),
    );
  });

  it("should cache results and return cached value on subsequent calls", async () => {
    const mockInstrumentsResponse: InstrumentsResponse = [
      { id: "Amulet", admin: "admin1" },
      { id: "0x1234567890abcdef", admin: "admin2" },
    ];

    mockNetwork.mockResolvedValue({ data: mockInstrumentsResponse, status: 200 });

    // First call - should fetch from API
    const result1 = await getEnabledInstrumentsCached(ctx(mockConfig));
    expect(result1).toEqual(new Set(["Amulet____admin1", "0x1234567890abcdef____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Second call - should return cached value
    const result2 = await getEnabledInstrumentsCached(ctx(mockConfig));
    expect(result2).toEqual(new Set(["Amulet____admin1", "0x1234567890abcdef____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1); // Still only 1 call

    // Third call - should still return cached value
    const result3 = await getEnabledInstrumentsCached(ctx(mockConfig));
    expect(result3).toEqual(new Set(["Amulet____admin1", "0x1234567890abcdef____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("should fetch fresh data after cache is cleared", async () => {
    const mockResponse1: InstrumentsResponse = [{ id: "Amulet", admin: "admin1" }];

    const mockResponse2: InstrumentsResponse = [
      { id: "Amulet", admin: "admin1" },
      { id: "0xnewtoken", admin: "admin2" },
    ];

    mockNetwork.mockResolvedValueOnce({ data: mockResponse1, status: 200 });

    // First call
    const result1 = await getEnabledInstrumentsCached(ctx(mockConfig));
    expect(result1).toEqual(new Set(["Amulet____admin1"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Clear cache
    await clearEnabledInstrumentsCache(ctx(mockConfig));

    // Set up new response
    mockNetwork.mockResolvedValueOnce({ data: mockResponse2, status: 200 });

    // Second call after clear - should fetch fresh data
    const result2 = await getEnabledInstrumentsCached(ctx(mockConfig));
    expect(result2).toEqual(new Set(["Amulet____admin1", "0xnewtoken____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("does not reuse instruments cached for another gateway with the same node id", async () => {
    mockNetwork
      .mockResolvedValueOnce({ data: [{ id: "TokenA", admin: "admin-a" }], status: 200 })
      .mockResolvedValueOnce({ data: [{ id: "TokenB", admin: "admin-b" }], status: 200 });

    await expect(getEnabledInstrumentsCached(ctx(gatewayA))).resolves.toEqual(
      new Set(["TokenA____admin-a"]),
    );
    await expect(getEnabledInstrumentsCached(ctx(gatewayB))).resolves.toEqual(
      new Set(["TokenB____admin-b"]),
    );
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("clears only the entry of the gateway it is given", async () => {
    mockNetwork.mockResolvedValue({ data: [{ id: "Amulet", admin: "admin1" }], status: 200 });
    await getEnabledInstrumentsCached(ctx(gatewayA));
    await getEnabledInstrumentsCached(ctx(gatewayB));

    await clearEnabledInstrumentsCache(ctx(gatewayA));
    await getEnabledInstrumentsCached(ctx(gatewayA));
    await getEnabledInstrumentsCached(ctx(gatewayB));

    expect(mockNetwork).toHaveBeenCalledTimes(3);
    expect(mockNetwork).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: expect.stringContaining(gatewayA.gatewayUrl) }),
    );
  });
});

describe("coin-config fields", () => {
  it("reads the node id from the config", () => {
    expect(getNodeId(createTestNodeConfig())).toBe("test-node-id");
  });

  it("fails with a config error when the node id is missing", () => {
    const config = { ...createTestNodeConfig(), nodeId: "" };

    expect(() => getNodeId(config)).toThrow(CantonInvalidConfigError);
    expect(() => getNodeId(config)).toThrow("nodeId");
  });

  it.each([undefined, ""])("fails with a config error for the gateway url %p", async gatewayUrl => {
    const config = { ...createTestNodeConfig(), gatewayUrl } as unknown as CantonCoinConfig;
    const mockNetwork = network as jest.MockedFunction<typeof network>;
    mockNetwork.mockClear();

    const result = getLedgerEnd(ctx(config));

    await expect(result).rejects.toThrow(CantonInvalidConfigError);
    await expect(result).rejects.toThrow("gatewayUrl");
    expect(mockNetwork).not.toHaveBeenCalled();
  });

  it("reads the gateway switch from the config", () => {
    expect(isGatewayEnabled(createMockCoinConfigValue({ useGateway: true }))).toBe(true);
    expect(isGatewayEnabled(createMockCoinConfigValue({ useGateway: false }))).toBe(false);
  });

  it.each([undefined, "true", 1])("rejects the gateway switch %p", useGateway => {
    const config = createMockCoinConfigValue({ useGateway: useGateway as unknown as boolean });

    expect(() => isGatewayEnabled(config)).toThrow(CantonInvalidConfigError);
    expect(() => isGatewayEnabled(config)).toThrow("useGateway");
  });
});

describe("cache lifetimes from the coin config", () => {
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  const cases: Array<{
    name: string;
    gateway?: Partial<CantonCoinConfig["gateway"]>;
    calTokensCacheTtlMs?: number;
    data: unknown;
    read: (config: CantonCoinConfig) => Promise<unknown>;
  }> = [
    {
      name: "DSO party",
      gateway: { dsoPartyCacheTtlMs: 1 },
      data: { dso_id: "DSO::1" },
      read: config => getDsoPartyIdCached(ctx(config)),
    },
    {
      name: "party by id",
      gateway: { partyCacheTtlMs: 1 },
      data: { party_id: "p", public_key: "k" },
      read: config => getPartyByIdCached(ctx(config), "ttl-party"),
    },
    {
      name: "topology check",
      gateway: { topologyCacheTtlMs: 1 },
      data: { party_id: "p" },
      read: config => isTopologyChangeRequiredCached(ctx(config), "ttl-key"),
    },
    {
      name: "enabled instruments",
      gateway: { instrumentsCacheTtlMs: 1 },
      data: [],
      read: config => getEnabledInstrumentsCached(ctx(config)),
    },
    {
      name: "CAL tokens",
      calTokensCacheTtlMs: 1,
      data: [],
      read: config => getCalTokensCached(ctx(config), "ttl-currency"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getDsoPartyIdCached.reset();
    getPartyByIdCached.reset();
    isTopologyChangeRequiredCached.reset();
    getEnabledInstrumentsCached.reset();
    getCalTokensCached.reset();
  });

  it.each(cases)("caches the $name for the module default", async ({ data, read }) => {
    mockNetwork.mockResolvedValue({ data, status: 200 });
    const config = createTestNodeConfig();

    await read(config);
    await read(config);

    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  // lru-cache reads the clock directly, so a real short TTL is used instead of fake timers.
  it.each(cases)(
    "reads the $name again after the configured TTL",
    async ({ gateway, calTokensCacheTtlMs, data, read }) => {
      mockNetwork.mockResolvedValue({ data, status: 200 });
      const config: CantonCoinConfig = {
        ...createTestNodeConfig(),
        ...(gateway ? { gateway: { ...createTestNodeConfig().gateway, ...gateway } } : {}),
        ...(calTokensCacheTtlMs ? { calTokensCacheTtlMs } : {}),
      };

      await read(config);
      await sleep(5);
      await read(config);

      expect(mockNetwork).toHaveBeenCalledTimes(2);
    },
  );
});

describe("cache lifetimes without a valid coin config value", () => {
  it.each([
    ["DSO party", "gateway.dsoPartyCacheTtlMs", (c: CantonContext) => getDsoPartyIdCached(c)],
    ["party by id", "gateway.partyCacheTtlMs", (c: CantonContext) => getPartyByIdCached(c, "p")],
    [
      "topology check",
      "gateway.topologyCacheTtlMs",
      (c: CantonContext) => isTopologyChangeRequiredCached(c, "k"),
    ],
    [
      "enabled instruments",
      "gateway.instrumentsCacheTtlMs",
      (c: CantonContext) => getEnabledInstrumentsCached(c),
    ],
  ])("names the field of a missing gateway group for the %s", async (_, field, read) => {
    const { gateway: _gateway, ...config } = createTestNodeConfig();
    const result = read(ctx(config as unknown as CantonCoinConfig));

    await expect(result).rejects.toThrow(CantonInvalidConfigError);
    await expect(result).rejects.toThrow(field);
  });

  it("rejects a zero TTL, which would cache without expiry", async () => {
    const config = createMockCoinConfigValue({ calTokensCacheTtlMs: 0 });
    const read = getCalTokensCached(ctx(config), "currency");

    await expect(read).rejects.toThrow(CantonInvalidConfigError);
    await expect(read).rejects.toThrow("calTokensCacheTtlMs");
  });
});
