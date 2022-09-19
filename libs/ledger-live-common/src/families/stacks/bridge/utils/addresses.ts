import { c32addressDecode } from "c32check";

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
    };

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const [version, data] = c32addressDecode(input);
    return { isValid: true, data: { version, data } };
  } catch (e) {
    return { isValid: false };
  }
};
