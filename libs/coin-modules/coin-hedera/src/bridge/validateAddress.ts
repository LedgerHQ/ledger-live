import invariant from "invariant";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { safeParseAccountId } from "../network/utils";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  const { currencyId } = parameters;
  invariant(currencyId, "hedera: currency id is required for address validation");

  const [error] = await safeParseAccountId({ configOrCurrencyId: currencyId, address });

  return error === null;
}
