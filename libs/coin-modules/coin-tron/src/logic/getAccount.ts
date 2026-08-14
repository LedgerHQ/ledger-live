import type { TronCoinConfig } from "../config";
import { fetchTronAccount } from "../network";
import { AccountTronAPI } from "../network/types";

export async function getAccount(
  config: TronCoinConfig,
  address: string,
): Promise<AccountTronAPI[]> {
  return await fetchTronAccount(config, address);
}
