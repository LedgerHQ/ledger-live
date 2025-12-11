import {
  getBalance,
  isPartyAlreadyExists,
  submitOnboarding,
  getEnabledInstruments,
  getEnabledInstrumentsCached,
  clearEnabledInstrumentsCache,
  type GetBalanceResponse,
  type InstrumentBalance,
  type InstrumentsResponse,
  type OnboardingPrepareResponse,
} from "./gateway";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import { TopologyChangeError } from "../types/errors";
import { LedgerAPI4xx } from "@ledgerhq/errors";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import network from "@ledgerhq/live-network";

const mockBalances: InstrumentBalance[] = [
  {
    instrument_id: "Amulet",
    amount: "10000000000000000000000000000000000000000",
    locked: false,
  },
  {
    instrument_id: "LockedAmulet",
    amount: "5000000000000000000000000000000000000000",
    locked: true,
  },
];

describe("getBalance", () => {
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  const mockNetwork = network as jest.MockedFunction<typeof network>;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
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
    const mockPartyId = "test-party-id-123";
    const mockPublicKey = "test-public-key-456";
    const error = new LedgerAPI4xx("Party already exists", {
      status: 409,
      url: undefined,
      method: "POST",
    });
    const mockPrepareResponse: OnboardingPrepareResponse = {
      party_id: mockPartyId,
      party_name: "Test Party",
      public_key_fingerprint: "fingerprint",
      transactions: {
        namespace_transaction: {
          serialized: "",
          transaction: { operation: "", serial: 0, mapping: {} },
          hash: "",
        },
        party_to_key_transaction: {
          serialized: "",
          transaction: { operation: "", serial: 0, mapping: {} },
          hash: "",
        },
        party_to_participant_transaction: {
          serialized: "",
          transaction: { operation: "", serial: 0, mapping: {} },
          hash: "",
        },
        combined_hash: "",
      },
    };

    mockNetwork.mockRejectedValue(error);

    const result = await submitOnboarding(mockCurrency, mockPublicKey, mockPrepareResponse, {
      signature: "test-signature",
    });

    expect(isPartyAlreadyExists(error)).toBe(true);
    expect(result.party).toEqual({ party_id: mockPartyId, public_key: mockPublicKey });
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
    const mockInstrumentsResponse: InstrumentsResponse = {
      instruments: [
        { instrument_id: "Amulet", display_name: "Canton Coin" },
        { instrument_id: "0x1234567890abcdef", display_name: "Test Token 1" },
        { instrument_id: "0xabcdef1234567890", display_name: "Test Token 2" },
      ],
    };

    mockNetwork.mockResolvedValue({ data: mockInstrumentsResponse, status: 200 });

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual(["Amulet", "0x1234567890abcdef", "0xabcdef1234567890"]);
    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/v1/node/test-node-id/instruments"),
      }),
    );
  });

  it("should return empty array on API failure (fail-safe)", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockNetwork.mockRejectedValue(new Error("Network error"));

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch enabled instruments:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return empty array when API returns empty instruments list", async () => {
    const mockEmptyResponse: InstrumentsResponse = {
      instruments: [],
    };

    mockNetwork.mockResolvedValue({ data: mockEmptyResponse, status: 200 });

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual([]);
  });

  it("should handle malformed API response gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    // API returns data without instruments property
    mockNetwork.mockResolvedValue({ data: { invalid: "response" }, status: 200 });

    const result = await getEnabledInstruments(mockCurrency);

    expect(result).toEqual([]);
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
    const mockInstrumentsResponse: InstrumentsResponse = {
      instruments: [{ instrument_id: "Amulet" }, { instrument_id: "0x1234567890abcdef" }],
    };

    mockNetwork.mockResolvedValue({ data: mockInstrumentsResponse, status: 200 });

    // First call - should fetch from API
    const result1 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result1).toEqual(["Amulet", "0x1234567890abcdef"]);
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Second call - should return cached value
    const result2 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result2).toEqual(["Amulet", "0x1234567890abcdef"]);
    expect(mockNetwork).toHaveBeenCalledTimes(1); // Still only 1 call

    // Third call - should still return cached value
    const result3 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result3).toEqual(["Amulet", "0x1234567890abcdef"]);
    expect(mockNetwork).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("should fetch fresh data after cache is cleared", async () => {
    const mockResponse1: InstrumentsResponse = {
      instruments: [{ instrument_id: "Amulet" }],
    };

    const mockResponse2: InstrumentsResponse = {
      instruments: [{ instrument_id: "Amulet" }, { instrument_id: "0xnewtoken" }],
    };

    mockNetwork.mockResolvedValueOnce({ data: mockResponse1, status: 200 });

    // First call
    const result1 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result1).toEqual(["Amulet"]);
    expect(mockNetwork).toHaveBeenCalledTimes(1);

    // Clear cache
    clearEnabledInstrumentsCache(mockCurrency);

    // Set up new response
    mockNetwork.mockResolvedValueOnce({ data: mockResponse2, status: 200 });

    // Second call after clear - should fetch fresh data
    const result2 = await getEnabledInstrumentsCached(mockCurrency);
    expect(result2).toEqual(["Amulet", "0xnewtoken"]);
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });
});
