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

  describe("listOperations", () => {
    it("should return ops", async () => {
      const ops = await api.listOperations(
        "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876",
        {
          minHeight: 0,
        },
      );
      expect(ops.length).toBeGreaterThan(0);
    });
  });
});
