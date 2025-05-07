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
      expect(lastBlock.time).not.toBe(new Date("1970-01-01"));
    });
  });

  // describe("combine and broadcast", () => {
  //   it("returns the hash", async () => {
  //     const tx = await api.combine("tx", "signature", "xpub");
  //     const hash = await api.broadcast(tx);

  //     expect(hash).toEqual(expect.any(String));
  //   });
  // });
});
