import { Address } from "@zondax/izari-filecoin/address";

export type ValidateAddressResult =
  | {
      isValid: true;
      bytes: Buffer;
    }
  | {
      isValid: false;
    };

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const bytes = Address.fromString(input).toBytes();
    return { isValid: true, bytes };
  } catch (error) {
    return { isValid: false };
  }
};
