// import { AptosAPI } from "../network";

import { AptosSettings } from "@aptos-labs/ts-sdk";
import { AptosAPI } from "../network";

export const broadcast = async (
  currencyIdOrSettings: AptosSettings | string,
  transaction: string,
): Promise<string> => {
  const client = new AptosAPI(currencyIdOrSettings);
  return await client.broadcast(transaction);
};
