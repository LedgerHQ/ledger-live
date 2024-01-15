import { Address } from "@zondax/izari-filecoin/address";
import { NetworkPrefix } from "@zondax/izari-filecoin/artifacts";
import { log } from "@ledgerhq/logs";

export type ValidateAddressResult =
  | {
      isValid: true;
      parsedAddress: Address;
    }
  | {
      isValid: false;
    };

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const parsedAddress = Address.fromString(input);
    return { isValid: true, parsedAddress };
  } catch (error) {
    log("debug", `[validateAddress] fromString invalid address`);
  }

  try {
    const parsedAddress = Address.fromEthAddress(NetworkPrefix.Mainnet, input);
    return { isValid: true, parsedAddress };
  } catch (error) {
    log("debug", `[validateAddress] fromEthAddress invalid address`);
  }

  return { isValid: false };
};
