import { getBalanceForAddress } from "../indexer-api/getBalanceForAddress";

describe("getBalanceForAddress", () => {
  it("returns the balance for a given address", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
    const result = await getBalanceForAddress(address);

    expect(result.address).toBe(address);
    expect(result.balance).toBeGreaterThan(0);
  });

  it("throws an error for an invalid address", async () => {
    const invalidAddress = "invalid:address";
    await expect(getBalanceForAddress(invalidAddress)).rejects.toThrow("Error fetching balance");
  });
});
