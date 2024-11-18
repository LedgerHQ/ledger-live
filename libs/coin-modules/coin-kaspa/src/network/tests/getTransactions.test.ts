import { getTransactions } from "../indexer-api/getTransactions";

describe("getTransactions function", () => {
  it("should fetch TXs for (burn)address from real API", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
    const result = await getTransactions(address);
    expect(result.length).toBeGreaterThan(30);
  });
});
