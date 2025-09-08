import { Balance } from "@ledgerhq/coin-framework/api/types";
import { mirrorNode } from "../network/mirror";

export async function getBalance(address: string): Promise<Balance[]> {
  const mirrorAccount = await mirrorNode.getAccount(address);

  return [
    {
      asset: { type: "native" },
      value: BigInt(mirrorAccount.balance.balance),
      locked: BigInt(0),
    },
  ];
}
