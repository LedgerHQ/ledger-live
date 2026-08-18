import { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { CantonCoinConfig } from "../config";
import { createMockContext } from "../test/fixtures";
import { createApi } from ".";

const context = createMockContext();
let api: CoinModuleApi<CantonCoinConfig>;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi();
  });

  describe("listOperations", () => {
    it("should return operations", async () => {
      const operations = await api.listOperations(
        context,
        "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
        { minHeight: 0 },
      );
      expect(operations.items.length).toBeGreaterThan(0);
    });
  });
});
