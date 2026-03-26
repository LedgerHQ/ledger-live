import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import * as bech32 from "bech32";
import cryptoFactory from "./chain/chain";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.currencyId) {
    throw new Error("Missing currency parameter on address validation for Cosmos");
  }

  let isValid = true;
  try {
    bech32.decode(address);
  } catch {
    isValid = false;
  }
  const prefix = cryptoFactory(parameters.currencyId).prefix;

  return isValid && address.startsWith(prefix);
}
