import type {
  Balance,
  BalanceOptions,
  CoinModuleImpl,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { lastBlock } from "../logic/lastBlock";
import { getBalance as getAccountBalance } from "../logic/getBalance";
import { listOperations } from "../logic/listOperations";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";
import { validateAddress } from "../bridge/validateAddress";
import type { CasperConfig, CasperContext, CasperMemo } from "../types";

// ADR-019: caller builds {@link CasperContext} and passes it to each method.
// `satisfies` (not `as`) preserves the concrete return types of each method for callers.
export function createApi() {
  return {
    lastBlock,
    getBalance(
      context: CasperContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> {
      return rejectBalanceOptions(() => getAccountBalance(context, address), options);
    },
    listOperations,
    craftTransaction: (_context, transactionIntent, options?) =>
      craftTransaction(transactionIntent, options?.customFees),
    combine: (_context, tx, signature, options?) => combine(tx, signature, options?.pubkey),
    broadcast: (context, tx, _options?) => broadcast(context, tx),
    estimateFees,
    validateIntent: async (_context, intent, balances, options?) =>
      validateIntent(intent, balances, options?.customFees),
    // Casper uses (transaction hash + TTL) for replay protection rather than a
    // per-account nonce, so getNextSequence has no meaningful value here.
    getNextSequence: async (_context: CasperContext, _address: string) => 0n,
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<CasperConfig, CasperMemo>;
}
