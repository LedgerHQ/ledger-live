import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { listOperations } from "./listOperations";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

describe("listOperations (integ, Cosmos Hub)", () => {
  it("returns at most the requested limit, with each op having a hash and a type", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

    const page = await listOperations(api, ADDR, { minHeight: 0, limit: 5 });

    expect(page.items.length).toBeLessThanOrEqual(5);
    for (const op of page.items) {
      expect(typeof op.tx.hash).toBe("string");
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(typeof op.type).toBe("string");
      expect(op.type.length).toBeGreaterThan(0);
    }
  });
});
