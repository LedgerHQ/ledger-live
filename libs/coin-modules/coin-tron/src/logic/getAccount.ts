import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../config";
import { fetchTronAccount } from "../network";
import { AccountTronAPI } from "../network/types";

export async function getAccount(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
): Promise<AccountTronAPI[]> {
  return await fetchTronAccount(logger, config, address);
}
