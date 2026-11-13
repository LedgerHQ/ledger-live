import { API_ENDPOINT, DELEGATION_API_ENDPOINT } from "../../test/integEndpoints";
/**
 * Integration tests — hit real MultiversX API.
 */
import { createNetworkApi } from "../../network/api";
import { listOperations } from "./listOperations";

const ACTIVE_ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("listOperations (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a page with items array", async () => {
    const result = await listOperations(api, ACTIVE_ADDR, { minHeight: 0 });
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("returns operations with required fields", async () => {
    const result = await listOperations(api, ACTIVE_ADDR, { minHeight: 0 });
    if (result.items.length > 0) {
      const op = result.items[0];
      expect(typeof op.id).toBe("string");
      expect(typeof op.type).toBe("string");
      expect(typeof op.value).toBe("bigint");
      expect(op.tx.hash.length).toBeGreaterThan(0);
    }
  });
});
