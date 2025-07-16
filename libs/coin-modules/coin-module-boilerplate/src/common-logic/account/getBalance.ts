import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getAccountInfo } from "../../network/node";
import { BoilerplateAsset } from "../../types";

// Could be getAccountInfo so it is used in both bridge and api
export async function getBalance(address: string): Promise<Balance<BoilerplateAsset>[]> {
  const accountInfo = await getAccountInfo(address);
  return [{ asset: { type: "native" }, value: BigInt(accountInfo.account_data.Balance) }];
}
