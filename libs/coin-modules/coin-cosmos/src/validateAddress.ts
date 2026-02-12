import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import * as bech32 from "bech32";
import cryptoFactory from "./chain/chain";

export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.currency) {
    throw new Error("Missing currency parameter on address validation for Cosmos");
  }

  let isValid = true;
  try {
    bech32.decode(address);
  } catch {
    isValid = false;
  }
  const currency = findCryptoCurrencyById(parameters.currency.name.toLowerCase());
  let prefix = "";
  if (currency) {
    prefix = cryptoFactory(currency.id).prefix;
  }

  return isValid && address.startsWith(prefix);
}
