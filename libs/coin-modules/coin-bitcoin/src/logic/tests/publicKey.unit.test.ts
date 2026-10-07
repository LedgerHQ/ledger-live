import { secp256k1 } from "@noble/curves/secp256k1";
import { compressPublicKey } from "../publicKey";

describe("compressPublicKey", () => {
  // Keys whose y coordinate is even and odd.
  const keys = [Buffer.alloc(32, 0x11), Buffer.alloc(32, 0x22)].map(privateKey => ({
    compressed: Buffer.from(secp256k1.getPublicKey(privateKey, true)),
    uncompressed: Buffer.from(secp256k1.getPublicKey(privateKey, false)),
  }));

  it("compresses an uncompressed key, whatever the parity of y", () => {
    expect(new Set(keys.map(k => k.compressed[0]))).toEqual(new Set([0x02, 0x03]));
    for (const { compressed, uncompressed } of keys) {
      expect(compressPublicKey(uncompressed.toString("hex"))).toEqual(compressed);
    }
  });

  it("keeps a compressed key", () => {
    expect(compressPublicKey(keys[0].compressed)).toEqual(keys[0].compressed);
  });

  it("refuses anything else", () => {
    expect(() => compressPublicKey("0011")).toThrow("invalid public key");
  });
});
