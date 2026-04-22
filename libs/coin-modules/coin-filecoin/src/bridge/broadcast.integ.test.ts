import * as Wallet from "iso-filecoin/wallet";
import { broadcast } from "./broadcast";
import BigNumber from "bignumber.js";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const mnemonic = Wallet.generateMnemonic();

    const sender = Wallet.accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");
    const receiver = Wallet.accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/1");

    const message = {
      version: 0,
      to: receiver.address.toString(),
      from: sender.address.toString(),
      nonce: 0,
      value: "1",
      gasLimit: 1000000,
      gasFeeCap: "1",
      gasPremium: "1",
      method: 0,
      params: "",
    };
    const sigBytes = Wallet.signMessage(sender.privateKey, "SECP256K1", message);

    await expect(
      broadcast({
        signedOperation: {
          signature: Buffer.from(sigBytes).toString("base64"),
          rawData: {
            version: 0,
            recipient: receiver.address.toString(),
            sender: sender.address.toString(),
            nonce: 0,
            value: "1",
            gasLimit: new BigNumber(1000000),
            gasFeeCap: "1",
            gasPremium: "1",
            method: 0,
            params: "",
            signatureType: 1,
          },
        },
      } as any),
    ).rejects.toThrow(/Something went wrong/);
  });
});
