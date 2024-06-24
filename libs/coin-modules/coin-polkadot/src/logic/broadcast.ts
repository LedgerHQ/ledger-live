import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(signature: string): Promise<string> {
  await loadPolkadotCrypto();
  return await polkadotAPI.submitExtrinsic(signature);
}
