import { secp256k1 } from "@noble/curves/secp256k1";
import { composeXpub } from "../xpub";

// ─── Reference test vector ──────────────────────────────────────────────
//
// Pulled verbatim from BIP-32 test vector 1 (chain m/0H), the canonical
// reference for serialized extended public keys. Reusing a published vector
// (rather than locally generating one) ensures `composeXpub` matches the
// industry-standard BIP-32 serialization byte for byte.
//
// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-1

/** xpub mainnet version bytes (BIP-32). */
const XPUB_MAINNET_VERSION = 0x0488b21e;

/** Master `m` SECP256K1 compressed public key. */
const MASTER_PUBKEY_HEX = "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2";

/** `m/0H` SECP256K1 compressed public key. */
const ACCOUNT_PUBKEY_HEX = "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";

/** `m/0H` BIP-32 chain code. */
const ACCOUNT_CHAIN_CODE_HEX =
  "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";

/** Expected base58 BIP-32 serialization for `m/0H`. */
const EXPECTED_M_0H_XPUB =
  "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw";

/** Hardened bit on a BIP-32 child index, equivalent to `0'`. */
const HARDENED_BIT = 0x80000000;

describe("composeXpub", () => {
  it("serializes a hardened depth-1 xpub matching the BIP-32 spec test vector", () => {
    const xpub = composeXpub({
      xpubVersion: XPUB_MAINNET_VERSION,
      depth: 1,
      childNumber: HARDENED_BIT, // realistic value coming from `pathStringToArray("0'")`
      parentPublicKeyHex: MASTER_PUBKEY_HEX,
      accountPublicKeyHex: ACCOUNT_PUBKEY_HEX,
      accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
    });

    expect(xpub).toBe(EXPECTED_M_0H_XPUB);
  });

  it("forces the hardened bit when childNumber is passed without it", () => {
    // Account paths in coin-bitcoin are always hardened; the function defends
    // against a non-hardened raw index by ORing in the hardened bit (0x80...).
    const xpub = composeXpub({
      xpubVersion: XPUB_MAINNET_VERSION,
      depth: 1,
      childNumber: 0, // unhardened — should still produce the m/0H serialization
      parentPublicKeyHex: MASTER_PUBKEY_HEX,
      accountPublicKeyHex: ACCOUNT_PUBKEY_HEX,
      accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
    });

    expect(xpub).toBe(EXPECTED_M_0H_XPUB);
  });

  it("compresses an uncompressed (65-byte) parent SECP256K1 public key before hashing", () => {
    // Real hw-app-btc devices return uncompressed (0x04 ‖ X ‖ Y) keys, so the
    // legacy code path that this util mirrors must also handle them.
    const uncompressedParent = Buffer.from(
      secp256k1.ProjectivePoint.fromHex(MASTER_PUBKEY_HEX).toRawBytes(false),
    ).toString("hex");
    expect(uncompressedParent).toHaveLength(65 * 2);
    expect(uncompressedParent.startsWith("04")).toBe(true);

    const xpub = composeXpub({
      xpubVersion: XPUB_MAINNET_VERSION,
      depth: 1,
      childNumber: HARDENED_BIT,
      parentPublicKeyHex: uncompressedParent,
      accountPublicKeyHex: ACCOUNT_PUBKEY_HEX,
      accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
    });

    expect(xpub).toBe(EXPECTED_M_0H_XPUB);
  });

  it("compresses an uncompressed (65-byte) account SECP256K1 public key before serializing", () => {
    const uncompressedAccount = Buffer.from(
      secp256k1.ProjectivePoint.fromHex(ACCOUNT_PUBKEY_HEX).toRawBytes(false),
    ).toString("hex");

    const xpub = composeXpub({
      xpubVersion: XPUB_MAINNET_VERSION,
      depth: 1,
      childNumber: HARDENED_BIT,
      parentPublicKeyHex: MASTER_PUBKEY_HEX,
      accountPublicKeyHex: uncompressedAccount,
      accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
    });

    expect(xpub).toBe(EXPECTED_M_0H_XPUB);
  });

  it("throws when a public key has an invalid SECP256K1 length", () => {
    const invalidPubKey = "ab".repeat(40); // 40 bytes — neither 33 nor 65

    expect(() =>
      composeXpub({
        xpubVersion: XPUB_MAINNET_VERSION,
        depth: 1,
        childNumber: HARDENED_BIT,
        parentPublicKeyHex: invalidPubKey,
        accountPublicKeyHex: ACCOUNT_PUBKEY_HEX,
        accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
      }),
    ).toThrow(/Unexpected SECP256K1 public key length.*got 40/);

    expect(() =>
      composeXpub({
        xpubVersion: XPUB_MAINNET_VERSION,
        depth: 1,
        childNumber: HARDENED_BIT,
        parentPublicKeyHex: MASTER_PUBKEY_HEX,
        accountPublicKeyHex: invalidPubKey,
        accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
      }),
    ).toThrow(/Unexpected SECP256K1 public key length.*got 40/);
  });

  it("encodes depth and childNumber so the resulting xpub round-trips through base58check", () => {
    // Exercise a realistic Zcash account path: `m/44'/133'/2'` (depth 3,
    // hardened child index = 2). We don't know the canonical xpub here, but
    // we can decode the output and assert each field byte-for-byte.
    //
    // NB: `HARDENED_BIT | 2` would coerce to a negative i32; the runtime path
    // (via `bippath`) returns the unsigned arithmetic value, so we mirror it.
    const hardenedChild = HARDENED_BIT + 2;
    const xpub = composeXpub({
      xpubVersion: XPUB_MAINNET_VERSION,
      depth: 3,
      childNumber: hardenedChild,
      parentPublicKeyHex: MASTER_PUBKEY_HEX,
      accountPublicKeyHex: ACCOUNT_PUBKEY_HEX,
      accountChainCodeHex: ACCOUNT_CHAIN_CODE_HEX,
    });

    const decoded = base58Decode(xpub);
    expect(decoded.length).toBe(82); // 4 + 1 + 4 + 4 + 32 + 33 + 4

    expect(decoded.readUInt32BE(0)).toBe(XPUB_MAINNET_VERSION);
    expect(decoded.readUInt8(4)).toBe(3);
    expect(decoded.readUInt32BE(9)).toBe(hardenedChild);
    expect(decoded.subarray(13, 45).toString("hex")).toBe(ACCOUNT_CHAIN_CODE_HEX);
    expect(decoded.subarray(45, 78).toString("hex")).toBe(ACCOUNT_PUBKEY_HEX);
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────

function base58Decode(input: string): Buffer {
  // Avoid importing bs58 in tests so the assertions stay independent of the
  // exact library composeXpub uses internally.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs58 = require("bs58");
  return Buffer.from(bs58.decode(input));
}
