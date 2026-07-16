import { createApi as createCeloApi } from "@ledgerhq/coin-celo/api/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../config";

/**
 * Local api for the generic coin framework.
 *
 * Celo is an EVM chain and its coin-module api is built on coin-evm's, so it
 * takes an EVM config getter (the same `{ info }` shape the legacy `setup.ts`
 * injects) rather than a dedicated Celo config.
 *
 * NOTE: this is currently inert — Celo is NOT enabled in
 * `genericCoinFrameworkFamilies.json`, so nothing invokes this yet. It exists so
 * the api is framework-ready; enabling it requires rewriting the LLD/LLM Celo
 * staking UI (which reads `account.celoResources`, not the generic staking shape).
 */
export function createLocalCeloApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  const getCurrencyConfig = () => ({
    info: getCurrencyConfiguration<EvmConfigInfo>(currencyId),
  });
  // coin-celo's createApi is typed with concrete <MemoNotSupported, BufferTxData>
  // params, so widen via `unknown` to the framework's `CoinModuleApi<any>`.
  return createCeloApi(getCurrencyConfig, currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
