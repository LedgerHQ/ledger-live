import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from ".";

let api: AlpacaApi;

describe("devnet", () => {
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
        "party-4f2e1485107adf5f::122027c6dbbbdbffe0fa3122ae05175f3b9328e879e9ce96b670354deb64a45683c1",
      );
      expect(balance.length).toBeGreaterThanOrEqual(1);
      const nativeBalance = balance.find(b => b.asset.type === "native");
      expect(nativeBalance?.value).toBeGreaterThanOrEqual(0);
    });
  });
});
