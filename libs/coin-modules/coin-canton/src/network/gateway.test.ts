import {
  getBalance,
  isPartyAlreadyExists,
  submitOnboarding,
  type GetBalanceResponse,
  type InstrumentBalance,
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
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
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
