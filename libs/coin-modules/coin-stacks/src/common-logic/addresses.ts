import { getAddressFromPublicKey } from "@stacks/transactions";
import { c32addressDecode } from "c32check";
import { getConfiguredStacksNetwork } from "./network";

type ValidateAddressResult =
  | {
      isValid: true;
      data: {
        version: number;
        data: string;
      };
    }
  | {
      isValid: false;
      error: any;
    };

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const [version, data] = c32addressDecode(input);
    return { isValid: true, data: { version, data } };
  } catch (e) {
    return { isValid: false, error: e };
  }
};

/** The address of a hex public key on the configured network, as the sync derives it. */
export const addressFromPublicKey = (publicKey: string): string =>
  getAddressFromPublicKey(publicKey, getConfiguredStacksNetwork());
