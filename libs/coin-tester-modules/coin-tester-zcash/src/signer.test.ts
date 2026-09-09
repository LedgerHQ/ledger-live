import bs58check from "bs58check";
import { derivePath, p2pkhAddress, P2PKH_VERSION } from "./signer";

// BIP32 spec's own official Test Vector 1 (seed and extended private keys),
// verbatim from https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki.
// No `bip32`/`tiny-secp256k1` dependency needed: an extended private key is
// just Base58Check(version[4] || depth[1] || parentFingerprint[4] ||
// childNumber[4] || chainCode[32] || 0x00 || privateKey[32]), so decoding one
// with `bs58check` (pure JS, no native build) is enough to read off the raw
// private key and chain code to compare against.
const TEST_SEED = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");

const TEST_VECTOR_1: Record<string, string> = {
  m: "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
  "0'": "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
  "0'/1":
    "xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs",
};

function decodeXprv(xprv: string): { privateKey: Buffer; chainCode: Buffer } {
  const raw = bs58check.decode(xprv);
  return { chainCode: Buffer.from(raw.slice(13, 45)), privateKey: Buffer.from(raw.slice(46, 78)) };
}

describe("derivePath", () => {
  it.each(Object.keys(TEST_VECTOR_1))(
    "matches BIP32 spec's own Test Vector 1 for path %s",
    path => {
      const expected = decodeXprv(TEST_VECTOR_1[path]);
      const actual = derivePath(TEST_SEED, path === "m" ? "" : path);

      expect(Buffer.from(actual.privateKey).toString("hex")).toBe(
        expected.privateKey.toString("hex"),
      );
      expect(Buffer.from(actual.chainCode).toString("hex")).toBe(
        expected.chainCode.toString("hex"),
      );
    },
  );
});

describe("p2pkhAddress", () => {
  it("round-trips through bs58check with the expected 2-byte version prefix", () => {
    const node = derivePath(TEST_SEED, "44'/133'/0'/0/0");
    const address = p2pkhAddress(node.privateKey);

    const decoded = bs58check.decode(address);
    expect(decoded.length).toBe(22); // 2-byte version + 20-byte hash160
    expect((decoded[0] << 8) | decoded[1]).toBe(P2PKH_VERSION);
  });

  it("is deterministic for the same private key", () => {
    const node = derivePath(TEST_SEED, "44'/133'/0'/0/0");
    expect(p2pkhAddress(node.privateKey)).toBe(p2pkhAddress(node.privateKey));
  });
});
