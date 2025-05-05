import { Network } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";

describe("createApi", () => {
  const api = createApi({ aptosSettings: { network: Network.MAINNET } });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock).toHaveProperty("hash");
      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock).toHaveProperty("time");
    });
  });
});
