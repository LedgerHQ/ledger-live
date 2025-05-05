import { SuiAsset } from "../api/types";
import { getAccount } from "../network";
import { Balance } from "@ledgerhq/coin-framework/api/types";

export async function getBalance(address: string): Promise<Balance<SuiAsset>[]> {
  const { balance } = await getAccount(address);
  return [
    {
      value: BigInt(balance.toString()),
      asset: { type: "native" },
    },
  ];
}
