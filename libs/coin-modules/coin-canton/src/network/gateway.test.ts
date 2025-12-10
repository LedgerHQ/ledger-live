import { LedgerAPI4xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import {
  createMockCantonCurrency,
  createMockInstrumentBalances,
  createMockOnboardingPrepareResponse,
  setupMockCoinConfig,
} from "../test/fixtures";
import { TopologyChangeError } from "../types/errors";
import type { GetBalanceResponse } from "../types/gateway";
import {
  clearEnabledInstrumentsCache,
  getBalance,
  getEnabledInstruments,
  getEnabledInstrumentsCached,
  isPartyAlreadyExists,
  submitOnboarding,
  type InstrumentsResponse,
} from "./gateway";

jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));

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

  it("should return and object with balances property", async () => {
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
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

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
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

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
