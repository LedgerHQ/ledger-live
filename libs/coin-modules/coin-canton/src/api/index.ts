import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { type CantonCoinConfig } from "../config";
import { combine } from "../logic/combine";

// The caller builds the {@link CantonContext} (config + logger) and passes it to each method (ADR-019).
//
// Not wired yet:
// - lastBlock, getBalance, listOperations: LIVE-36963.
// - craftTransaction, estimateFees, broadcast: LIVE-36964.
// - validateIntent: LIVE-36965.
//
// Not supported by design:
// - getBlock, getBlockInfo: the ledger exposes offsets, not blocks.
// - getStakes, getRewards, getValidators: Canton has no staking.
// - register: no indexer enrollment backend.
// - call: the gateway exposes no read-only contract call.
// - craftRawTransaction: the gateway prepares every transaction, so there is no external one to wrap.
export function createApi(): CoinModuleApi<CantonCoinConfig> {
  return {
    ...notSupportedApi<CantonCoinConfig>(),
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    // Canton has no account nonce; the generic signOperation calls this when the transaction has none, so it must not throw.
    getNextSequence: (_context, _address) => Promise.resolve(0n),
  };
}
