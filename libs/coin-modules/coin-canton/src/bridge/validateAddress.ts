import { isRecipientValid } from "../common-logic";

export const validateAddress = async (
  address: string,
  _parameters: Partial<Record<string, unknown>>,
): Promise<boolean> => {
  return isRecipientValid(address);
};
