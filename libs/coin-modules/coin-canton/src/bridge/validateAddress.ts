import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-framework/api/types";
import { isRecipientValid } from "../common-logic";

export const validateAddress = async (
  address: string,
  _parameters: Partial<Record<string, unknown>>,
): Promise<boolean> => {
  return isRecipientValid(address);
};
