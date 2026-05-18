import type { CoinFrameworkSigner } from "./types";
import { loadSignerForFamily } from "../../coin-modules/registry";

const networkToFamily = (network: string) => {
  if (network === "ripple") return "xrp";
  return network;
};

export function getSigner(network: string): CoinFrameworkSigner {
  const family = networkToFamily(network);
  const signer = loadSignerForFamily(family);
  if (!signer) throw new Error(`No signer registered for network ${network}`);
  return signer;
}
