import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { combine } from "../common-logic/transaction/combine";
import { type CantonCoinConfig } from "../config";

// The caller builds the {@link CantonContext} (config + logger) and passes it to each method (ADR-019).
// Canton is single-chain and its Alpaca methods don't read config, so createApi takes nothing.
//
// Only three methods are wired so far: the rest of the chain's support is still to come, and
// spreading `notSupportedApi()` keeps that state readable — what is listed below is what this
// module does, everything else raises "<method> is not supported" from the framework. The
// message follows the method name, so it can no longer disagree with the method it stands for.
export function createApi(): CoinModuleApi<CantonCoinConfig> {
  return {
    ...notSupportedApi<CantonCoinConfig>(),
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}
