import { fetchAllOperations } from "./horizon";
import coinConfig, { type StellarCoinConfig } from "../config";

describe("fetchAllOperations", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: "https://horizon.stellar.org",
          fetchLimit: 50,
        },
      }),
    );
  });

  it("should return 200 operations", async () => {
    const accountId = "GABFQIK63R2NETJM7T673EAMZN4RJLLGP3OFUEJU5SZVTGWUKULZJNL6"; // Binance deposit address
    const maxOperations = 200;
    const returnedOps = await fetchAllOperations(accountId, accountId, "desc", "", maxOperations);
    expect(returnedOps.length).toEqual(maxOperations);
  });

  it("should return all operations", async () => {
    const accountId = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const returnedOps = await fetchAllOperations(accountId, accountId, "desc", "");
    // We cannot accurately know how much operations there actually is.
    expect(returnedOps.length).toBeGreaterThan(0);
  });
});
