import { Balance } from "@ledgerhq/coin-framework/api/types";
import api from "../network/tzkt";
import { TezosAsset } from "../types";

/**
 * Retunrs the balance of the given address.
 * If the address is an empty account, returns -1.
 */
export async function getBalance(address: string): Promise<Balance<TezosAsset>[]> {
  const apiAccount = await api.getAccountByAddress(address);
  return [
    {
      value: apiAccount.type === "user" ? BigInt(apiAccount.balance) : BigInt(-1),
      asset: { type: "native" },
    },
  ];
}
