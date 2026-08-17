declare module "react-native-fast-crypto" {
  export const secp256k1: {
    publicKeyTweakAdd(
      publicKey: Uint8Array,
      tweak: Uint8Array,
      compressed?: boolean,
    ): Promise<Uint8Array>;
  };

  export function scrypt(
    passwd: Uint8Array,
    salt: Uint8Array,
    N: number,
    r: number,
    p: number,
    size: number,
  ): Promise<Uint8Array>;
}
