import { LedgerAPI4xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import {
  createMockCantonCurrency,
  createMockInstrumentBalances,
  createMockOnboardingPrepareResponse,
  setupMockCoinConfig,
} from "../test/fixtures";
import { TopologyChangeError } from "../types/errors";
import type { GetBalanceResponse } from "../types/gateway";
import { getBalance, isPartyAlreadyExists, submitOnboarding } from "./gateway";

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
