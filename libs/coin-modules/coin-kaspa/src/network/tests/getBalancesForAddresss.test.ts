import { getBalancesForAddresses } from "../index";

describe("getBalanceForAddress", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });

  it("returns the balance for a given address", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
          balance: 1122124984318255,
        },
        {
          address: "kaspa:qqkqkzjvr7zwxxmjxjkmxxdwju9kjs6e9u82uh59z07vgaks6gg62v8707g73",
          balance: 132655169913451,
        },
      ],
    });

    const addresses = [
      "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      "kaspa:qqkqkzjvr7zwxxmjxjkmxxdwju9kjs6e9u82uh59z07vgaks6gg62v8707g73",
    ];
    const result = await getBalancesForAddresses(addresses);

    expect(result[0].address).toBe(addresses[0]);
    expect(result[0].balance).toBeGreaterThan(0);
    expect(result.length).toBe(2);
  });

  it("throws an error for an invalid address", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
    });
    const invalidAddress = "invalid:address";
    await expect(getBalancesForAddresses([invalidAddress])).rejects.toThrow(
      "Error fetching balance",
    );
  });
});
