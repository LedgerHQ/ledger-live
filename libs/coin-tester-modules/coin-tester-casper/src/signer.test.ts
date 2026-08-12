import { generateKeyPairSync } from "crypto";
import { KeyAlgorithm, NativeTransferBuilder, PublicKey, Transaction } from "casper-js-sdk";
import { casperAddressFromPubKey } from "@ledgerhq/coin-casper/logic";
import { buildCasperSigner } from "./signer";

// Node's SEC1 export appends the public key, `casper-devnet derive --secret-key`
// does not, so the DER is reassembled to keep the shape the signer really receives.
const SEC1_PREFIX = Buffer.from("302e0201010420", "hex");
const SEC1_SECP256K1_PARAMS = Buffer.from("a00706052b8104000a", "hex");

// Generated per run: a committed PEM is private-key material that secret scanners flag.
function generateDevnetKey(): { pem: string; taggedPublicKey: string } {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "secp256k1" });
  const { d, x, y } = privateKey.export({ format: "jwk" });

  // JWK pads each coordinate to the curve's 32-byte width.
  const scalar = Buffer.from(d as string, "base64url");
  const xBytes = Buffer.from(x as string, "base64url");
  const yBytes = Buffer.from(y as string, "base64url");
  const der = Buffer.concat([SEC1_PREFIX, scalar, SEC1_SECP256K1_PARAMS]);

  return {
    pem: [
      "-----BEGIN EC PRIVATE KEY-----",
      der.toString("base64"),
      "-----END EC PRIVATE KEY-----",
    ].join("\n"),
    taggedPublicKey: Buffer.concat([
      Buffer.from([KeyAlgorithm.SECP256K1, yBytes[yBytes.length - 1] % 2 === 0 ? 0x02 : 0x03]),
      xBytes,
    ]).toString("hex"),
  };
}

const SENDER_PATH = "44'/506'/0'/0/100";
const { pem: SENDER_PEM, taggedPublicKey: SENDER_PUBLIC_KEY } = generateDevnetKey();
const { taggedPublicKey: RECIPIENT_PUBLIC_KEY } = generateDevnetKey();

// version byte + u32 field count + 3 (u16 index, u32 offset) pairs + u32 blob length
const BLOB_START = 5 + 3 * 6 + 4;

const buildTransfer = (): Transaction =>
  new NativeTransferBuilder()
    .from(PublicKey.fromHex(SENDER_PUBLIC_KEY))
    .target(PublicKey.fromHex(RECIPIENT_PUBLIC_KEY))
    .amount("10000000000")
    .id(1)
    .chainName("casper")
    .payment(100000000)
    .build();

describe("buildCasperSigner", () => {
  const signer = buildCasperSigner({ [SENDER_PATH]: SENDER_PEM });

  it("returns the bare compressed key, leaving the address to the module's resolver", async () => {
    const { publicKey, Address } = await signer.getAddressAndPubKey(SENDER_PATH);

    expect(publicKey).toHaveLength(33);
    expect(Address).toHaveLength(0);
    expect(casperAddressFromPubKey(publicKey, KeyAlgorithm.SECP256K1)).toBe(SENDER_PUBLIC_KEY);
  });

  it("returns the same key from showAddressAndPubKey", async () => {
    const shown = await signer.showAddressAndPubKey(SENDER_PATH);
    const fetched = await signer.getAddressAndPubKey(SENDER_PATH);

    expect(shown.publicKey.toString("hex")).toBe(fetched.publicKey.toString("hex"));
  });

  it("signs the hash embedded in the serialized transaction", async () => {
    const tx = buildTransfer();

    const { signatureRS } = await signer.sign(SENDER_PATH, Buffer.from(tx.toBytes()));

    expect(signatureRS).toHaveLength(64);
    tx.setSignature(
      Buffer.concat([Buffer.from([KeyAlgorithm.SECP256K1]), signatureRS]),
      PublicKey.fromHex(SENDER_PUBLIC_KEY),
    );
    expect(tx.validate()).toBe(true);
  });

  it("rejects bytes whose embedded hash does not match the payload", async () => {
    const bytes = Buffer.from(buildTransfer().toBytes());
    expect(bytes.readUInt32LE(1)).toBe(3); // BLOB_START assumes a 3-field calltable
    bytes[BLOB_START] ^= 0xff; // first byte of field 0, the embedded hash

    await expect(signer.sign(SENDER_PATH, bytes)).rejects.toThrow(/embedded hash/);
  });

  it("fails loudly for an unknown derivation path", async () => {
    await expect(signer.sign("44'/506'/0'/0/999", Buffer.alloc(0))).rejects.toThrow(
      /no key for path/,
    );
  });
});
