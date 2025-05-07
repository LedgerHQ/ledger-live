import { Account, Network } from "@aptos-labs/ts-sdk";
// import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";
import { AptosSender } from "../../types/assets";

describe("createApi", () => {
  const api = createApi({ aptosSettings: { network: Network.DEVNET } });

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

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // const accountA = Account.generate();

      const SENDER: AptosSender = {
        xpub: "0xc7a5a529eb69b4f40519c3334eed48f090af354ec6c0893129ebed30328e245c",
        freshAddress: "0xf2a89ea976c60f98bd8a2cbc33b49e6d1de38618a6991692dee61c9b4745ad4a",
      };
      const RECIPIENT = Account.generate().accountAddress.toString();

      // const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

      // const res = await aptos.fundAccount({
      //   accountAddress: SENDER.freshAddress,
      //   amount: 1000,
      // });

      // console.log(res);

      const amount = BigInt(100);

      const fees = await api.estimateFees({
        asset: { type: "native", function: "0x1::aptos_account::transfer_coins" },
        type: "send",
        sender: SENDER,
        amount,
        recipient: RECIPIENT,
      });

      // Then
      expect(fees.value).toEqual(BigInt(55100));
    });
  });
});
