import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createMockCoinConfigValue } from "../test/fixtures";
import { createApi } from ".";

let api: AlpacaApi;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi(createMockCoinConfigValue());
  });

  describe("getBalance", () => {
    it("should return user balance", async () => {
      const balance = await api.getBalance(
        "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
      );
      expect(balance.length).toBeGreaterThanOrEqual(0);
      if (balance.length > 0) {
        const nativeBalance = balance.find(b => b.asset.type === "Amulet");
        if (nativeBalance) {
          expect(nativeBalance.value).toBeGreaterThanOrEqual(BigInt(0));
        }
      }
    });
  });
});
