import { secp256k1 } from "@noble/curves/secp256k1";

/**
 * Implement the subset of secp256k1 that wallet-btc needs to work.
 * The interface is made asynchronous to be more efficient to run in a renderer thread and defer the cryptography
 */
export type Secp256k1Instance = {
  publicKeyTweakAdd(publicKey: Uint8Array, tweak: Uint8Array): Promise<Uint8Array>;
};

// Helper function to convert bytes to bigint
function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex);
}

// default uses @noble/curves
let impl: Secp256k1Instance = {
  publicKeyTweakAdd: (publicKey, tweak) => {
    try {
      const point = secp256k1.ProjectivePoint.fromHex(publicKey);
      const scalar = bytesToBigInt(tweak);
      const tweakedPoint = point.add(secp256k1.ProjectivePoint.BASE.multiply(scalar));
      return Promise.resolve(tweakedPoint.toRawBytes(point.toRawBytes().length === 33));
    } catch (error) {
      return Promise.reject(error);
    }
  },
};

/**
 * allows to override the default Secp256k1Instance
 */
export function setSecp256k1Instance(override: Secp256k1Instance): void {
  impl = override;
}

/**
 * get the current Secp256k1Instance
 */
export function getSecp256k1Instance(): Secp256k1Instance {
  return impl;
}
