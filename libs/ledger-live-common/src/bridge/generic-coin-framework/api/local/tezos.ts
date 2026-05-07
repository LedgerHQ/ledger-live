import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../../config";

export function createLocalTezosApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createTezosApi(getCurrencyConfiguration<TezosCoinConfig>(currencyId)) as AlpacaApi<any> &
    BridgeApi;
}
