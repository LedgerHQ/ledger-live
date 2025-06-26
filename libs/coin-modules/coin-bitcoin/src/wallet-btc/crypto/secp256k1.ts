import * as ecc from "@bitcoinerlab/secp256k1";
import { Point } from "@noble/secp256k1";

/**
 * Implement the subset of secp256k1 that wallet-btc needs to work.
 * The interface is made asynchronous to be more efficient to run in a renderer thread and defer the cryptography
 */
function publicKeyTweakAdd(
  publicKey: Uint8Array,
  tweak: Uint8Array,
  compressed: boolean = true,
): Uint8Array | null {
  try {
    if (!ecc.isPoint(publicKey)) {
      return null;
    }

    if (!ecc.isPrivate(tweak)) {
      return null;
    }

    const pubPoint = Point.fromHex(publicKey);
    const tweakPoint = Point.fromPrivateKey(tweak);
    const resultPoint = pubPoint.add(tweakPoint);

    return resultPoint.toRawBytes(compressed);
  } catch {
    return null;
  }
}
export type Secp256k1Instance = {
  publicKeyTweakAdd(publicKey: Uint8Array, tweak: Uint8Array): Promise<Uint8Array>;
};

// default uses node.js's secp256k1
let impl: Secp256k1Instance = {
  publicKeyTweakAdd: async (publicKey, tweak) => {
    const result = publicKeyTweakAdd(publicKey, tweak);
    if (!result) throw new Error("Failed to tweak public key");
    return result;
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
