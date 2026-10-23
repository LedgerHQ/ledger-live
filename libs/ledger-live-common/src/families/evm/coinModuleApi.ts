import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";

export function createLocalEvmApi(): CoinModuleApi<any> {
  return createEvmApi() as unknown as CoinModuleApi<any>;
}
