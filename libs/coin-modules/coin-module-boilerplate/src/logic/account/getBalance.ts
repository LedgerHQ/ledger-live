import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { BoilerplateContext } from "../../config";
import { getAccountInfo } from "../../network/node";

// Could be getAccountInfo so it is used in both bridge and api
export async function getBalance(context: BoilerplateContext, address: string): Promise<Balance[]> {
  const config = await context.config();
  const accountInfo = await getAccountInfo(config, address);
  return [{ asset: { type: "native" }, value: BigInt(accountInfo.account_data.Balance) }];
}
