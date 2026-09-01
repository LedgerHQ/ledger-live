import { BIP32Factory } from "bip32";
import bs58check from "bs58check";
import { secp256k1 } from "@noble/curves/secp256k1";
import { derivePath, p2pkhAddress, P2PKH_VERSION } from "./signer";

// ECC wrapper for @noble/curves/secp256k1 to be compatible with BIP32Factory,
// mirroring coin-tester-bitcoin's own signer.ts (test-only cross-check here,
// not shipped): bip32 v4 dropped its bundled secp256k1 implementation and
// requires the caller to supply one.
function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex);
}

function bigIntToBytes(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const eccWrapper = {
  isPoint(point: Uint8Array | Buffer): boolean {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      if (pointBytes.length !== 33 && pointBytes.length !== 65) return false;
      secp256k1.ProjectivePoint.fromHex(pointBytes);
      return true;
    } catch {
      return false;
    }
  },

  isPrivate(privateKey: Uint8Array | Buffer): boolean {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (keyBytes.length !== 32) return false;
      return secp256k1.utils.isValidPrivateKey(keyBytes);
    } catch {
      return false;
    }
  },

  pointFromScalar(privateKey: Uint8Array | Buffer, compressed = true): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (!this.isPrivate(keyBytes)) return null;
      return secp256k1.getPublicKey(keyBytes, compressed);
    } catch {
      return null;
    }
  },

  pointAddScalar(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;
      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const scalarPoint = secp256k1.ProjectivePoint.BASE.multiply(bytesToBigInt(scalarBytes));
      const result = p.add(scalarPoint);

      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  privateAdd(privateKey: Uint8Array | Buffer, scalar: Uint8Array | Buffer): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;
      if (!this.isPrivate(keyBytes) || !this.isPrivate(scalarBytes)) return null;

      const result = (bytesToBigInt(keyBytes) + bytesToBigInt(scalarBytes)) % secp256k1.CURVE.n;
      if (result === 0n) return null;
      return bigIntToBytes(result);
    } catch {
      return null;
    }
  },

  pointMultiply(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;
      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const result = p.multiply(bytesToBigInt(scalarBytes));
      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  pointCompress(point: Uint8Array | Buffer, compressed = true): Uint8Array {
    const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
    return secp256k1.ProjectivePoint.fromHex(pointBytes).toRawBytes(compressed);
  },

  isPointCompressed(point: Uint8Array | Buffer): boolean {
    return point.length === 33;
  },

  sign(hash: Uint8Array | Buffer, privateKey: Uint8Array | Buffer): Uint8Array {
    const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
    const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
    return secp256k1.sign(hashBytes, keyBytes, { prehash: false }).toCompactRawBytes();
  },

  verify(
    hash: Uint8Array | Buffer,
    publicKey: Uint8Array | Buffer,
    signature: Uint8Array | Buffer,
  ): boolean {
    try {
      const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
      const pubKeyBytes = publicKey instanceof Buffer ? new Uint8Array(publicKey) : publicKey;
      const sigBytes = signature instanceof Buffer ? new Uint8Array(signature) : signature;
      return secp256k1.verify(sigBytes, hashBytes, pubKeyBytes, { prehash: false });
    } catch {
      return false;
    }
  },
};

const bip32 = BIP32Factory(eccWrapper);

// BIP32 spec's own official test vector 1 seed.
const TEST_SEED = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");

describe("derivePath", () => {
  it.each(["0'", "0'/1", "0'/1/2'", "0'/1/2'/2", "44'/133'/0'/0/0"])(
    "matches bip32's own CKDpriv derivation for path %s",
    path => {
      const ours = derivePath(TEST_SEED, path);
      const theirs = bip32.fromSeed(TEST_SEED).derivePath(path);

      expect(Buffer.from(ours.privateKey).toString("hex")).toBe(
        Buffer.from(theirs.privateKey as Uint8Array).toString("hex"),
      );
      expect(Buffer.from(ours.chainCode).toString("hex")).toBe(
        Buffer.from(theirs.chainCode).toString("hex"),
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
