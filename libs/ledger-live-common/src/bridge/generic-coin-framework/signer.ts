import type { CoinFrameworkSigner } from "./types";
import { loadSignerForFamily } from "../../coin-modules/registry";

const networkToFamily = (network: string) => {
  if (network === "ripple") return "xrp";
  return network;
};

export async function getSigner(network: string): Promise<CoinFrameworkSigner> {
  const family = networkToFamily(network);
  const signer = await loadSignerForFamily(family);
  if (!signer) throw new Error(`No signer registered for network ${network}`);
  return signer;
}
