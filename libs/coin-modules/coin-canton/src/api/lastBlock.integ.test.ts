import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from ".";
import { CantonCoinConfig } from "../config";

let api: AlpacaApi;

describe("localnet", () => {
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
    });
  });

  describe("lastBlock", () => {
    it("should return ledger end", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock.height).toBeGreaterThan(0);
    });
  });
});
