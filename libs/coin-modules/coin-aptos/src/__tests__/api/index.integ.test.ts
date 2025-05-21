import { Hex, Network } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";
import { getEnv } from "@ledgerhq/live-env";
import { AptosSender } from "../../types/assets";

describe("createApi", () => {
  const api = createApi({
    aptosSettings: {
      network: Network.MAINNET,
      fullnode: getEnv("APTOS_API_ENDPOINT"),
      indexer: getEnv("APTOS_INDEXER_ENDPOINT"),
    },
  });
  const sender: AptosSender = {
    xpub: "0x474dd8fad13de7ebc82e1cb7ec4e5320887a58010fc484ed5bc8c5ed73fcd8b0",
    freshAddress: "0xa0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec8",
  };
  const recipient: AptosSender = {
    xpub: "0x64159425ccc6e755b91dc801b93d182af978c4624d9064facaa9b147544db87f",
    freshAddress: "0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb",
  };

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

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        asset: {
          type: "native",
        },
        type: "send",
        sender,
        amount,
        recipient: recipient.freshAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0);
    });
  });
});
