import { loadAccountRawAssignForFamily } from "../../coin-modules/registry";
import type { AccountRawAssignHooks } from "./types";

export async function getAccountRawAssignHooks(network: string): Promise<AccountRawAssignHooks> {
  return (await loadAccountRawAssignForFamily(network)) ?? {};
}
