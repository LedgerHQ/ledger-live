import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { ethers } from "ethers";

const ethAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (ethAddressRegex.exec(address) !== null) {
    return address === ethers.getAddress(address);
  }

  return address.endsWith(".eth");
}
