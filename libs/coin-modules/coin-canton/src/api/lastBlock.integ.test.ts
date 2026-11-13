import { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { cantonDefaults, type CantonCoinConfig } from "../config";
import { createMockContext } from "../test/fixtures";
import { createApi } from ".";

const context = createMockContext(cantonDefaults.canton_network_devnet);
let api: CoinModuleApi<CantonCoinConfig>;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi("canton_network_devnet");
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock(context);
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
