import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { validateAddress as zondaxValidateAddress } from "@zondax/ledger-live-icp/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const result = await zondaxValidateAddress(address);
  return result.isValid;
}
