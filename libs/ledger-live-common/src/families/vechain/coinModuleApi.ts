import { createApi as createVechainApi } from "@ledgerhq/coin-vechain/api/index";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { VechainCurrencyConfig } from "@ledgerhq/coin-vechain/config";
import { getCurrencyConfiguration } from "../../config";

export function createLocalVechainApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  // Typed against the module's own config so a missing `node.url` fails here rather than at the
  // first network call; the value comes from `families/vechain/config.ts`.
  return createVechainApi(
    () => getCurrencyConfiguration<VechainCurrencyConfig>(currencyId),
    currencyId,
  ) as CoinModuleApi<any> & BridgeApi;
}
