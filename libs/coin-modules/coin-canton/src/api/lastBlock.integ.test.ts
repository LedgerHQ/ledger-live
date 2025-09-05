import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from ".";
import { CantonCoinConfig } from "../config";

let api: AlpacaApi;

describe.skip("localnet", () => {
  beforeAll(() => {
    api = createApi({
      nodeUrl: "http://localhost:2975/v2",
      networkType: "localnet",
    } satisfies Partial<CantonCoinConfig>);
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});

describe("devnet", () => {
  beforeAll(() => {
    api = createApi({
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com/v2",
      networkType: "devnet",
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
    });
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
