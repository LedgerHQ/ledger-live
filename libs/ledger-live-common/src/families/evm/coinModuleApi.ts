import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

export function createLocalEvmApi(currencyId: string): CoinModuleApi<any> {
  return createEvmApi(
    getCurrencyConfiguration<EvmConfigInfo>(currencyId),
    currencyId,
  ) as unknown as CoinModuleApi<any>;
}
