import { Account, Network } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";
import { AptosSender } from "../../types/assets";
import { getEnv } from "@ledgerhq/live-env";

describe("createApi", () => {
  const api = createApi({
    aptosSettings: {
      network: Network.MAINNET,
      fullnode: getEnv("APTOS_API_ENDPOINT"),
      indexer: getEnv("APTOS_INDEXER_ENDPOINT"),
    },
  });
  const sender: AptosSender = {
    xpub: "474dd8fad13de7ebc82e1cb7ec4e5320887a58010fc484ed5bc8c5ed73fcd8b0",
    freshAddress: "0xa0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec8",
  };
  const recipient = Account.generate().accountAddress.toString();

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock).toHaveProperty("hash");
      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock).toHaveProperty("time");
    });
  });

  describe("combine and broadcast", () => {
    it("returns the hash", async () => {
      const tx = await api.combine("tx", "signature", "xpub");
      const hash = await api.broadcast(tx);

      expect(hash).toEqual(expect.any(String));
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        asset: {
          type: "native",
          function: "0x1::aptos_account::transfer_coins",
        },
        type: "send",
        sender,
        amount,
        recipient,
      });

      expect(fees.value).toEqual(BigInt(55100));

      if (fees.parameters) {
        expect(fees.parameters.gasLimit).toEqual(BigInt(551));
        expect(fees.parameters.gasPrice).toEqual(BigInt(100));
      }
    });
  });

  describe("listOperations", () => {
    it("returns operations from account", async () => {
      const block = await api.lastBlock();

      const [operations] = await api.listOperations(sender.freshAddress, {
        minHeight: block.height,
      });

      expect(Array.isArray(operations)).toBeDefined();
      expect(operations.length).toBeGreaterThanOrEqual(10);
    });
  });
});
