import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from ".";

let api: AlpacaApi;

describe.skip("devnet", () => {
  beforeAll(() => {
    api = createApi({
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com/v2",
      networkType: "devnet",
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
      useGateway: true,
      nativeInstrumentId: "Amulet",
    });
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
