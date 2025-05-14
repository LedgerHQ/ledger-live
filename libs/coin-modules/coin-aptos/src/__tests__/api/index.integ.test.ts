import { Hex, Network } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";

describe("createApi", () => {
  const api = createApi({ aptosSettings: { network: Network.MAINNET } });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock).toHaveProperty("hash");
      expect(Hex.isValid(lastBlock.hash ?? "").valid).toBeTruthy();

      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock.height).toBeGreaterThan(0);

      expect(lastBlock).toHaveProperty("time");
      expect(lastBlock.time).not.toBeUndefined();
      expect(lastBlock.time?.getFullYear()).toBeGreaterThan(0);
      expect(lastBlock.time?.getMonth()).toBeGreaterThan(0);
      expect(lastBlock.time?.getDay()).toBeGreaterThan(0);
    });
  });
});
