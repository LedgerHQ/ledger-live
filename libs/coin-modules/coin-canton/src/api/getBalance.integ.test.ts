import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from ".";

let api: AlpacaApi;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi({
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com/v2",
      networkType: "devnet",
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      nativeInstrumentId: "Amulet",
    });
  });

  describe("getBalance", () => {
    it("should return user balance", async () => {
      const balance = await api.getBalance(
        "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876a",
      );
      expect(balance.length).toBeGreaterThanOrEqual(0);
      if (balance.length > 0) {
        const nativeBalance = balance.find(b => b.asset.type === "native");
        if (nativeBalance) {
          expect(nativeBalance.value).toBeGreaterThanOrEqual(BigInt(0));
        }
      }
    });
  });
});
