import { fetchTronAccount } from "../network";
import { AccountTronAPI } from "../network/types";

export async function getAccount(address: string): Promise<AccountTronAPI[]> {
  return await fetchTronAccount(address);
}
