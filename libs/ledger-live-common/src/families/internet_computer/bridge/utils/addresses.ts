import { log } from "@ledgerhq/logs";
import { Account, Address } from "@ledgerhq/types-live";
import { fetchBalances } from "./network";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export async function validateAddress(
  address: string
): Promise<{ isValid: boolean }> {
  try {
    const res = await fetchBalances(address);
    if (!res.balances) throw Error(res.details?.error_message);
    return { isValid: true };
  } catch (e: any) {
    log("error", e.message ?? "Failed to validate address");
    return { isValid: false };
  }
}
