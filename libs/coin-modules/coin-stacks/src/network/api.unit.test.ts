import { fetchAllTokenBalances, fetchFullTxs } from "./api";

describe("Stacks API", () => {
  it("should fetch full transactions", async () => {
    const addr = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";
    const [tokenTransfers, contractTransactions] = await fetchFullTxs(addr);
    expect(tokenTransfers.length).toBeGreaterThan(0);
    expect(contractTransactions.length).toBeGreaterThan(0);
  });

  it("fetch all token balances", async () => {
    const addr = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";
    const tokenBalances = await fetchAllTokenBalances(addr);
    expect(Object.keys(tokenBalances).length).toBeGreaterThan(0);
  });
});
