import { LedgerAPI4xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import {
  createMockCantonCurrency,
  createMockInstrumentBalances,
  createMockOnboardingPrepareResponse,
  createMockPendingTransferProposal,
  setupMockCoinConfig,
} from "../test/fixtures";
import { TopologyChangeError } from "../types/errors";
import type { GetBalanceResponse } from "../types/gateway";
import { TransactionType } from "../types/gateway";
import {
  clearEnabledInstrumentsCache,
  clearIsTopologyChangeRequiredCache,
  getBalance,
  getCalTokensCached,
  getEnabledInstruments,
  getEnabledInstrumentsCached,
  getLedgerEnd,
  getOperations,
  getPartyById,
  getPartyByPubKey,
  getPendingTransferProposals,
  getTransferPreApproval,
  isPartyAlreadyExists,
  isPartyNotFound,
  isTopologyChangeRequired,
  isTopologyChangeRequiredCached,
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

describe("getPartyById and getPartyByPubKey", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPartyById calls GET with by=party-id and returns party", async () => {
    const party = { party_id: "p1", public_key: "pk1" };
    mockNetwork.mockResolvedValue({ data: party, status: 200 });

    const result = await getPartyById(mockCurrency, "p1");

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

    const result = await getPartyByPubKey(mockCurrency, "abc123");

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

    await expect(getPartyById(mockCurrency, "missing")).rejects.toThrow(TopologyChangeError);
  });
});

describe("prepareOnboarding", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POSTs public_key and public_key_type ed25519 to onboarding/prepare", async () => {
    const prepared = createMockOnboardingPrepareResponse();
    mockNetwork.mockResolvedValue({ data: prepared, status: 200 });

    const result = await prepareOnboarding(mockCurrency, "pk-hex");

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

    await expect(prepareOnboarding(mockCurrency, "pk")).rejects.toThrow("Gateway down");
  });
});

describe("submitOnboarding", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;
  const prepareResponse = createMockOnboardingPrepareResponse();

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns party on success without application_signature in body when omitted", async () => {
    const submitResponse = {
      party: { party_id: "pid", public_key: "pk" },
    };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submitOnboarding(mockCurrency, "pk", prepareResponse, {
      signature: "sig",
    });

    expect(result).toEqual(submitResponse);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const call = mockNetwork.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data).not.toHaveProperty("application_signature");
  });

  it("includes application_signature when provided", async () => {
    const submitResponse = {
      party: { party_id: "pid", public_key: "pk" },
    };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    await submitOnboarding(mockCurrency, "pk", prepareResponse, {
      signature: "sig",
      applicationSignature: "app-sig",
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const call = mockNetwork.mock.calls[0][0] as { data: { application_signature?: string } };
    expect(call.data.application_signature).toBe("app-sig");
  });
});

describe("isTopologyChangeRequired", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when prepareOnboarding returns a response", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await expect(isTopologyChangeRequired(mockCurrency, "pk")).resolves.toBe(true);
  });

  it("returns false when prepare response is falsy", async () => {
    mockNetwork.mockResolvedValue({ data: undefined, status: 200 });

    await expect(isTopologyChangeRequired(mockCurrency, "pk")).resolves.toBe(false);
  });

  it("returns false on party already exists", async () => {
    mockNetwork.mockRejectedValue(new Error("Party already exists"));

    await expect(isTopologyChangeRequired(mockCurrency, "pk")).resolves.toBe(false);
  });

  it("rethrows other errors", async () => {
    mockNetwork.mockRejectedValue(new Error("Service unavailable"));

    await expect(isTopologyChangeRequired(mockCurrency, "pk")).rejects.toThrow(
      "Service unavailable",
    );
  });
});

describe("isTopologyChangeRequiredCached", () => {
  const mockCurrency = createMockCantonCurrency();
  const pubKey = "test-pub-key";
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearIsTopologyChangeRequiredCache(mockCurrency, pubKey);
  });

  it("caches result per pubKey and nodeId", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await expect(isTopologyChangeRequiredCached(mockCurrency, pubKey)).resolves.toBe(true);
    await expect(isTopologyChangeRequiredCached(mockCurrency, pubKey)).resolves.toBe(true);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("fetches again after clearIsTopologyChangeRequiredCache", async () => {
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await isTopologyChangeRequiredCached(mockCurrency, pubKey);
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    clearIsTopologyChangeRequiredCache(mockCurrency, pubKey);
    mockNetwork.mockResolvedValue({ data: createMockOnboardingPrepareResponse(), status: 200 });

    await isTopologyChangeRequiredCached(mockCurrency, pubKey);
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});

describe("getLedgerEnd, getOperations, getPendingTransferProposals, getTransferPreApproval", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getLedgerEnd returns numeric ledger end", async () => {
    mockNetwork.mockResolvedValue({ data: 42, status: 200 });

    await expect(getLedgerEnd(mockCurrency)).resolves.toBe(42);
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

    const result = await getOperations(mockCurrency, "party-1", { cursor: 1, limit: 10 });

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

    const result = await getPendingTransferProposals(mockCurrency, "party-1");

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

    const result = await getTransferPreApproval(mockCurrency, "party-1");

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
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

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

    const result = await prepare(mockCurrency, "party-1", params);

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

    await prepareTransferRequest(mockCurrency, "party-1", params);

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

    await prepareTransferInstruction(mockCurrency, "party-1", params);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        data: params,
      }),
    );
  });

  it("preparePreApprovalTransaction sends transfer-pre-approval-proposal", async () => {
    const preApprovalPrepare = {
      serialized: "s",
      json: {},
      hash: "hash",
    };
    mockNetwork.mockResolvedValue({ data: preApprovalPrepare, status: 200 });

    const result = await preparePreApprovalTransaction(mockCurrency, "party-1");

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

    const result = await prepareTapRequest(mockCurrency, { partyId: "party-1" });

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

    await prepareTapRequest(mockCurrency, { partyId: "party-1", amount: "1000" });

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

    await prepareTapRequest(mockCurrency, { partyId: "party-1", amount: "0" });

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

    const result = await submit(mockCurrency, "party-1", "ser-hex", "sig-hex");

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

    const result = await submitTransferInstruction(mockCurrency, "party-1", "ser", "sig");

    expect(result).toEqual(submitResponse);
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("submitPreApprovalTransaction returns PreApprovalResult", async () => {
    const submitResponse = { submission_id: "sub1", update_id: "upd1" };
    mockNetwork.mockResolvedValue({ data: submitResponse, status: 200 });

    const result = await submitPreApprovalTransaction(
      mockCurrency,
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

    const result = await submitTapRequest(mockCurrency, {
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig({ nodeId: "test-node-id" });
  });

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

    const map1 = await getCalTokensCached(mockCurrency);
    const map2 = await getCalTokensCached(mockCurrency);

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

    await getCalTokensCached(mockCurrency);
    getCalTokensCached.clear(mockCurrency.id);
    mockNetwork.mockResolvedValue({
      data: [{ ...calTokens[0], token_identifier: "ident2" }],
      status: 200,
    });

    const map = await getCalTokensCached(mockCurrency);
    expect(map.get("tok1")).toBe("ident2");
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});

describe("getBalance", () => {
  const mockCurrency = createMockCantonCurrency();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    setupMockCoinConfig();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an array of balances (backwards compatibility)", async () => {
    mockNetwork.mockResolvedValue({ data: mockBalances, status: 200 });
    const result = await getBalance(mockCurrency, "test-party-id");

    expect(result).toEqual(mockBalances);
  });

  it("should return an object with balances property", async () => {
    const mockResponse: GetBalanceResponse = {
      at_round: 123,
      balances: mockBalances,
    };

    mockNetwork.mockResolvedValue({ data: mockResponse, status: 200 });
    const result = await getBalance(mockCurrency, "test-party-id");

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

    const result = await submitOnboarding(mockCurrency, mockPublicKey, mockPrepareResponse, {
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

    await expect(getBalance(mockCurrency, "test-party-id")).rejects.toThrow(TopologyChangeError);
  });
});

describe("getEnabledInstruments", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
      nodeId: "test-node-id",
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });

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

    const result = await getEnabledInstruments(mockCurrency);

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

  it("should return empty Set on API failure (fail-safe)", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockNetwork.mockRejectedValue(new Error("Network error"));

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual(new Set());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch enabled instruments:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return empty Set when API returns empty instruments list", async () => {
    const mockEmptyResponse: InstrumentsResponse = [];

    mockNetwork.mockResolvedValue({ data: mockEmptyResponse, status: 200 });

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual(new Set());
  });

  it("should handle malformed API response gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    // API returns data that is not an array
    mockNetwork.mockResolvedValue({ data: { invalid: "response" }, status: 200 });

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual(new Set());
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe("getEnabledInstrumentsCached", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
      nodeId: "test-node-id",
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    clearEnabledInstrumentsCache(mockCurrency);
  });

  it("should cache results and return cached value on subsequent calls", async () => {
    const mockInstrumentsResponse: InstrumentsResponse = [
      { id: "Amulet", admin: "admin1" },
      { id: "0x1234567890abcdef", admin: "admin2" },
    ];

    mockNetwork.mockResolvedValue({ data: mockInstrumentsResponse, status: 200 });

    // First call - should fetch from API
    const result1 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result1).toEqual(new Set(["Amulet____admin1", "0x1234567890abcdef____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Second call - should return cached value
    const result2 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result2).toEqual(new Set(["Amulet____admin1", "0x1234567890abcdef____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1); // Still only 1 call

    // Third call - should still return cached value
    const result3 = await getEnabledInstrumentsCached(mockCurrency);
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
    const result1 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result1).toEqual(new Set(["Amulet____admin1"]));
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Clear cache
    clearEnabledInstrumentsCache(mockCurrency);

    // Set up new response
    mockNetwork.mockResolvedValueOnce({ data: mockResponse2, status: 200 });

    // Second call after clear - should fetch fresh data
    const result2 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result2).toEqual(new Set(["Amulet____admin1", "0xnewtoken____admin2"]));
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});
