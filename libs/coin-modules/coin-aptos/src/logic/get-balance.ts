import type { AptosSettings } from "@aptos-labs/ts-sdk";
import type { Balance } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import { AptosAPI } from "../network";

export async function getBalance(
  currencyIdOrSettings: AptosSettings | string,
  address: string,
): Promise<Balance<AptosAsset>[]> {
  const client = new AptosAPI(currencyIdOrSettings);
  const balance = await client.getBalance(address);

  const result: Balance<AptosAsset> = {
    value: BigInt(balance.toString()),
    asset: { type: "native" },
  };

  return [result];
}
