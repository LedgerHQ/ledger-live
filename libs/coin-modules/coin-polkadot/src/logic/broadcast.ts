import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export default async function broadcast(signature: string): Promise<string> {
  await loadPolkadotCrypto();
  return await polkadotAPI.submitExtrinsic(signature);
}
