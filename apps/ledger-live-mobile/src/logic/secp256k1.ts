import { secp256k1 } from "react-native-fast-crypto";

export async function publicKeyTweakAdd(
  publicKey: Uint8Array,
  tweak: Uint8Array,
): Promise<Uint8Array> {
  const pkeyArr = new Uint8Array(Buffer.from(publicKey).toJSON().data);
  const tweakArr = new Uint8Array(Buffer.from(tweak).toJSON().data);
  const r = await secp256k1.publicKeyTweakAdd(pkeyArr, tweakArr, true);
  return r;
}
