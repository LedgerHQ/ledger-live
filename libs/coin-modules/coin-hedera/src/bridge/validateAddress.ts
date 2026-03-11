import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { safeParseAccountId } from "../logic/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const [error] = await safeParseAccountId(address);
  return error === null;
}
