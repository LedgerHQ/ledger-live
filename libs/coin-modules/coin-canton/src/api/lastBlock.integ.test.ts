import { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createMockCoinConfigValue } from "../test/fixtures";
import { createApi } from ".";

let api: CoinModuleApi;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi(createMockCoinConfigValue());
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
