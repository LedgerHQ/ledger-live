import secp256k1 from "secp256k1";

/**
 * Implement the subset of secp256k1 that wallet-btc needs to work.
 * The interface is made asynchronous to be more efficient to run in a renderer thread and defer the cryptography
 */
export type Secp256k1Instance = {
  publicKeyTweakAdd(publicKey: Uint8Array, tweak: Uint8Array): Promise<Uint8Array>;
};

// default uses node.js's secp256k1
let impl: Secp256k1Instance = {
  publicKeyTweakAdd: (publicKey, tweak) =>
    Promise.resolve(secp256k1.publicKeyTweakAdd(publicKey, tweak)),
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
