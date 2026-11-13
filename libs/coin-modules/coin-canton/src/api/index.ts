import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { type CantonCoinConfig, type CantonContext } from "../config";
import { combine } from "../logic/combine";
import { getAccountStatus, type CantonAccountStatus } from "../logic/getAccountStatus";

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
/** Proposed for `CoinModuleApi` in coin-modules ADR-079 (LedgerHQ/coin-modules#1292), on the account key (the public key here); declared here until the framework has it. */
type AccountStatusCapability<C> = {
  getAccountStatus: (context: C, key: string) => Promise<CantonAccountStatus>;
};

export function createApi(
  currencyId: string,
): CoinModuleApi<CantonCoinConfig> & AccountStatusCapability<CantonContext> {
  return {
    ...notSupportedApi<CantonCoinConfig>(),
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    // Canton has no account nonce; the generic signOperation calls this when the transaction has none, so it must not throw.
    getNextSequence: (_context, _address) => Promise.resolve(0n),
    getAccountStatus: (context, publicKey) => getAccountStatus(context, currencyId, publicKey),
  };
}
