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

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock(context);
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
