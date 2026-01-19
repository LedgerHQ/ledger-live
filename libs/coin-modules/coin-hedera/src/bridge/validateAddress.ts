import invariant from "invariant";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { safeParseAccountId } from "../logic/utils";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  invariant(parameters.currency, "hedera: currency is missing from validateAddress parameters");
  const [error] = safeParseAccountId({ currency: parameters.currency, address });
  return error === null;
}
