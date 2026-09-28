// No types are shipped. Only `scrypt`: the app declares `secp256k1` for its own consumer.
declare module "react-native-fast-crypto" {
  export function scrypt(
    passwd: Uint8Array,
    salt: Uint8Array,
    N: number,
    r: number,
    p: number,
    size: number,
  ): Promise<Uint8Array>;
}
