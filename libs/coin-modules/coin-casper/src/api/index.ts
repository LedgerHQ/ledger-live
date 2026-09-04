import type {
  Balance,
  BalanceOptions,
  CoinModuleImpl,
} from "@ledgerhq/coin-module-framework/api/index";
import { notSupported } from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
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

// The caller builds the {@link CasperContext} (config + logger) and passes it to each method (ADR-019).
//
// Casper supports everything the contract requires but `craftTransactionData`, so it declares
// the authoring type and omits its unsupported *capabilities* — block queries, `call`,
// `register`, staking and raw crafting — rather than stubbing each one. That distinction is
// the point: eight omissions are capabilities this chain does not expose, while the stub
// below is a required method this module does not implement, which the type will not let us
// omit and which therefore stays visible here.
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
    craftTransactionData: notSupported("craftTransactionData"),
  } satisfies CoinModuleImpl<CasperConfig, CasperMemo>;
}
