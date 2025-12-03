import { getBalance, type GetBalanceResponse, type InstrumentBalance } from "./gateway";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";

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
});
