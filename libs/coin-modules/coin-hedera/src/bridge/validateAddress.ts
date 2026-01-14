import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { safeParseAccountId } from "../logic/utils";

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const [error] = safeParseAccountId(address);
  return error === null;
}
