import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { type CantonCoinConfig, type CantonContext } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getAccountStatus, type CantonAccountStatus } from "../logic/getAccountStatus";
import { getBalance } from "../logic/getBalance";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";
import type { CantonMemo } from "../types/transaction";

// Not in `CoinModuleApi` yet.
type AccountStatusCapability<C> = {
  getAccountStatus: (context: C, key: string) => Promise<CantonAccountStatus>;
};

// The caller builds the {@link CantonContext} (config + logger) and passes it to each method (ADR-019).
//
// Not supported by design:
// - getBlock, getBlockInfo: the ledger exposes offsets, not blocks.
// - getStakes, getRewards, getValidators: Canton has no staking.
// - register: no indexer enrollment backend.
// - call: the gateway exposes no read-only contract call.
// - craftRawTransaction: the gateway prepares every transaction, so there is no external one to wrap.
// - onboarding, pre-approval, transfer instructions and tap: crafted and submitted by the bridge only.
export function createApi(
  currencyId = "canton_network",
): CoinModuleApi<CantonCoinConfig, CantonMemo> & AccountStatusCapability<CantonContext> {
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
    validateIntent: (context, intent, balances, options?) =>
      validateIntent(context, intent, balances, options?.customFees),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    // Canton has no account nonce; the generic signOperation calls this when the transaction has none, so it must not throw.
    getNextSequence: (_context, _address) => Promise.resolve(0n),
    getAccountStatus: (context, publicKey) => getAccountStatus(context, currencyId, publicKey),
  };
}
