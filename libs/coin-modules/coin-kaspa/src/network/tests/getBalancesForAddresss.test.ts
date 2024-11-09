import { getBalancesForAddresses } from "../indexer-api/getBalancesForAddresses";

describe("getBalanceForAddress", () => {
  it("returns the balance for a given address", async () => {
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
    const invalidAddress = "invalid:address";
    await expect(getBalancesForAddresses([invalidAddress])).rejects.toThrow("Error fetching balance");
  });
});
