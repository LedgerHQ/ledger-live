import { getAccountInfo as networkGetAccountInfo } from "../network";
import { AccountInfo } from "../types";

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  const accountInfo = await networkGetAccountInfo(address, true);
  return accountInfo;
}
