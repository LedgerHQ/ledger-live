import { getBalancesForAddresses } from "../network";
import { getBalance } from "./getBalance";

const mockGetBalancesForAddresses = jest.fn();
jest.mock("../network", () => ({
  ...jest.requireActual("../network"),
  getBalancesForAddresses: (...args: unknown[]) => mockGetBalancesForAddresses(...args),
}));

const ADDRESS = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the native KAS balance as a single-entry array", async () => {
    mockGetBalancesForAddresses.mockResolvedValue([{ address: ADDRESS, balance: 500000000 }]);

    const balances = await getBalance(ADDRESS);

    expect(mockGetBalancesForAddresses).toHaveBeenCalledWith([ADDRESS]);
    expect(balances).toEqual([{ value: 500000000n, asset: { type: "native", name: "KAS" } }]);
  });

  it("falls back to 0 when the address is absent from the indexer response", async () => {
    mockGetBalancesForAddresses.mockResolvedValue([]);

    const balances = await getBalance(ADDRESS);

    expect(balances).toEqual([{ value: 0n, asset: { type: "native", name: "KAS" } }]);
  });

  it("propagates network errors", async () => {
    mockGetBalancesForAddresses.mockRejectedValue(new Error("network down"));

    await expect(getBalance(ADDRESS)).rejects.toThrow("network down");
  });
});
