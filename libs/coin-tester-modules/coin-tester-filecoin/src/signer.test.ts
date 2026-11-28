import { Message } from "iso-filecoin/message";
import { signMessage, accountFromMnemonic } from "iso-filecoin/wallet";
import { buildFilecoinSigner, buildGenericFilecoinSigner } from "./signer";
import { TEST_MNEMONIC } from "./fixtures";

const PATH = "44'/461'/0'/0/0";
const account = accountFromMnemonic(TEST_MNEMONIC, "SECP256K1", `m/${PATH}`, undefined, "mainnet");

function aMessage() {
  return new Message({
    to: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
    from: account.address.toString(),
    nonce: 3,
    value: "1000000000000000000",
    gasFeeCap: "100000",
    gasLimit: 1000000,
    gasPremium: "1000",
    method: 0,
    version: 0,
  });
}

describe("Filecoin test signer", () => {
  it("derives the glif address, with or without the leading m/", async () => {
    const signer = buildFilecoinSigner(TEST_MNEMONIC);
    for (const path of [PATH, `m/${PATH}`]) {
      const { addrString, compressed_pk } = await signer.getAddressAndPubKey(path);
      expect(addrString).toBe(account.address.toString());
      expect(addrString).toMatch(/^f1/);
      expect(Buffer.from(compressed_pk)).toStrictEqual(Buffer.from(account.publicKey));
    }
  });

  it("signs the message CID like the library does, in 65 bytes", async () => {
    const message = aMessage();
    const { signature_compact, signature_der } = await buildFilecoinSigner(TEST_MNEMONIC).sign(
      PATH,
      message.serialize(),
    );
    expect(signature_compact).toHaveLength(65);
    expect(Buffer.from(signature_compact)).toStrictEqual(
      Buffer.from(signMessage(account.privateKey, "SECP256K1", message).data),
    );
    expect(signature_der[0]).toBe(0x30);
  });

  it("gives the generic signer's base64 of the same signature", async () => {
    const message = aMessage();
    const cbor = Buffer.from(message.serialize()).toString("base64");
    const signature = await buildGenericFilecoinSigner(TEST_MNEMONIC).signTransaction(
      PATH,
      JSON.stringify({ cbor, message: {} }),
    );
    expect(Buffer.from(signature, "base64")).toStrictEqual(
      Buffer.from(signMessage(account.privateKey, "SECP256K1", message).data),
    );
  });

  it("returns the generic signer's address and public key", async () => {
    const { address, publicKey } = await buildGenericFilecoinSigner(TEST_MNEMONIC).getAddress(PATH);
    expect(address).toBe(account.address.toString());
    expect(publicKey).toBe(Buffer.from(account.publicKey).toString("hex"));
  });

  it("refuses a crafted payload without cbor", async () => {
    await expect(
      buildGenericFilecoinSigner(TEST_MNEMONIC).signTransaction(PATH, JSON.stringify({})),
    ).rejects.toThrow(/cbor/);
  });
});
