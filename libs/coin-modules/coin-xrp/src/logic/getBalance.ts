import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getAccountInfo } from "../network";
import { XrpAsset } from "../types";

export async function getBalance(address: string): Promise<Balance<XrpAsset>[]> {
  const accountInfo = await getAccountInfo(address);
  return [{ value: BigInt(accountInfo.balance), asset: { type: "native" } }];
}
