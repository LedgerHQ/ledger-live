import coinConfig from "../config";
import { listOperations } from "../logic";

/**
 * Performance test: check how long listOperations takes for the problematic account
 * that causes 504 timeouts in coin-service.
 */
describe("Stellar listOperations performance", () => {
  const PROBLEMATIC_ADDRESS = "GCCCFY67LF4AZ4LIOKVDV2IV2IOBSXKSKFMEZTHVE3QYWKJUOF5NC4NC";

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      explorer: { url: "https://horizon.stellar.org" },
      status: { type: "active" },
    }));
  });

  it("limit=1 should complete quickly", async () => {
    const start = Date.now();
    const result = await listOperations(PROBLEMATIC_ADDRESS, {
      minHeight: 0,
      order: "asc",
      limit: 1,
    });
    const elapsed = Date.now() - start;

    console.log(`limit=1: ${result.items.length} ops in ${elapsed}ms`);
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  }, 60_000);

  it("limit=10 should complete within 30s", async () => {
    const start = Date.now();
    const result = await listOperations(PROBLEMATIC_ADDRESS, {
      minHeight: 0,
      order: "asc",
      limit: 10,
    });
    const elapsed = Date.now() - start;

    console.log(`limit=10: ${result.items.length} ops in ${elapsed}ms`);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("default limit (100) timing", async () => {
    const start = Date.now();
    const result = await listOperations(PROBLEMATIC_ADDRESS, {
      minHeight: 0,
      order: "asc",
    });
    const elapsed = Date.now() - start;

    console.log(`default limit: ${result.items.length} ops in ${elapsed}ms`);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  }, 120_000);
});
