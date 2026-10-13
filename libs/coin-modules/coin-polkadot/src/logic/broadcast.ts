import { type PolkadotCoinConfig } from "../config";
import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(
  config: PolkadotCoinConfig,
  signedExtrinsic: string,
  currencyId: string,
): Promise<string> {
  await loadPolkadotCrypto();

  await polkadotAPI.submitExtrinsicDryRun(config, signedExtrinsic, currencyId);
  return await polkadotAPI.submitExtrinsic(config, signedExtrinsic, currencyId);
}
