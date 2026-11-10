import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { type CantonCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import type { CantonMemo } from "../types/transaction";

// The caller builds the {@link CantonContext} (config + logger) and passes it to each method (ADR-019).
//
// Not wired yet:
// - validateIntent: LIVE-36965.
//
// Not supported by design:
// - getBlock, getBlockInfo: the ledger exposes offsets, not blocks.
// - getStakes, getRewards, getValidators: Canton has no staking.
// - register: no indexer enrollment backend.
// - call: the gateway exposes no read-only contract call.
// - craftRawTransaction: the gateway prepares every transaction, so there is no external one to wrap.
// - onboarding, pre-approval, transfer instructions and tap: crafted and submitted by the bridge only.
export function createApi(): CoinModuleApi<CantonCoinConfig, CantonMemo> {
  return {
    ...notSupportedApi<CantonCoinConfig, CantonMemo>(),
    lastBlock,
    getBalance: (context, address, options?) =>
      rejectBalanceOptions(() => getBalance(context, address), options),
    listOperations,
    craftTransaction: (context, intent, _options?) => craftTransaction(context, intent),
    estimateFees: async (context, intent, _options?) => ({
      value: await estimateFees(context, intent.amount),
    }),
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    broadcast: (context, tx, _options?) => broadcast(context, tx),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    // Canton has no account nonce; the generic signOperation calls this when the transaction has none, so it must not throw.
    getNextSequence: (_context, _address) => Promise.resolve(0n),
  };
}
