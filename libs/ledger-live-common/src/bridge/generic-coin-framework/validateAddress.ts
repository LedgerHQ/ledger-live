import type { ValidateAddressFn } from "../../coin-modules/types";
import { loadValidateAddressForFamily } from "../../coin-modules/registry";

// coin-framework network names differ from coin family names in a few cases.
const networkToFamily: Record<string, string> = { ripple: "xrp" };

export async function getValidateAddress(network: string): Promise<ValidateAddressFn> {
  const family = networkToFamily[network] ?? network;
  const fn = await loadValidateAddressForFamily(family);
  if (!fn) throw new Error(`No validate address function for network ${network}`);
  return fn;
}
