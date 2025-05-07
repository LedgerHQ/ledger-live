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

  // describe("combine and broadcast", () => {
  //   it("returns the hash", async () => {
  //     const tx = await api.combine("tx", "signature", "xpub");
  //     const hash = await api.broadcast(tx);

  //     expect(hash).toEqual(expect.any(String));
  //   });
  // });
});
