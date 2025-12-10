import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createMockCoinConfigValue } from "../test/fixtures";
import { createApi } from ".";

let api: AlpacaApi;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi(createMockCoinConfigValue());
  });

  describe("listOperations", () => {
    it("should return operations", async () => {
      const operations = await api.listOperations(
        "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
        { minHeight: 0 },
      );
      expect(operations.length).toBeGreaterThan(0);
    });
  });
});
