import type { QuantovaSigner, QuantovaAddress } from "../types";
import { isValidQAddress } from "../logic/address";

/**
 * Resolve a Quantova account address from the device for a derivation path.
 *
 * The device returns the account's PQ public key and its canonical "Q1…" address
 * (derived as SHA3-256(pubkey)[0..20], byte0 = 0x40, rendered Bech32m). We sanity-check
 * the address shape host-side.
 */
export function getAddressResolver(getSigner: (deviceId: string) => Promise<QuantovaSigner>) {
  return async (deviceId: string, path: string): Promise<QuantovaAddress> => {
    const signer = await getSigner(deviceId);
    const result = await signer.getAddress(path);
    if (!isValidQAddress(result.address)) {
      throw new Error(`device returned a non-canonical Quantova address: ${result.address}`);
    }
    return result;
  };
}

export default getAddressResolver;
