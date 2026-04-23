import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalEvmApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createEvmApi(
    getCurrencyConfiguration<EvmConfigInfo>(currencyId),
    currencyId,
  ) as unknown as AlpacaApi<any> & BridgeApi;
}
