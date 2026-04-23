import type { ValidateAddressFn } from "../../coin-modules/types";
import { loadValidateAddressForFamily } from "../../coin-modules/registry";

// Alpaca network names differ from coin family names in a few cases.
const networkToFamily: Record<string, string> = { ripple: "xrp" };

export function getValidateAddress(network: string): ValidateAddressFn {
  const family = networkToFamily[network] ?? network;
  const fn = loadValidateAddressForFamily(family);
  if (!fn) throw new Error(`No validate address function for network ${network}`);
  return fn;
}
