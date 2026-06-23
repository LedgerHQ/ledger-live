import { generateMnemonic, accountFromMnemonic, signMessage } from "iso-filecoin/wallet";
import { broadcast } from "./broadcast";

describe("broadcast (integration)", () => {
  it("rejects a signed transaction from an unfunded account", async () => {
    const mnemonic = generateMnemonic();
    const sender = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");
    const recipient = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/1");

    const message = {
      version: 0,
      to: recipient.address.toString(),
      from: sender.address.toString(),
      nonce: 0,
      value: "1",
      gasLimit: 1000000,
      gasFeeCap: "1",
      gasPremium: "1",
      method: 0,
      params: "",
    };

    const sigBytes = signMessage(sender.privateKey, "SECP256K1", message);

    const signedTx = JSON.stringify({
      message: {
        ...message,
        gaslimit: message.gasLimit,
        gasfeecap: message.gasFeeCap,
        gaspremium: message.gasPremium,
      },
      signature: { type: 1, data: Buffer.from(sigBytes.data).toString("base64") },
    });

    await expect(broadcast(signedTx)).rejects.toThrow(/Something went wrong/);
  });
});
