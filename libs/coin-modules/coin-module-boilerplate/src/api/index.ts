import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleImpl,
  BalanceOptions,
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import BigNumber from "bignumber.js";
import { type BoilerplateCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../logic";

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it: a module lists the
// methods it implements and simply omits the capabilities the chain does not have. `satisfies` keeps
// the precise type of what is returned, so a caller sees exactly which methods exist — an annotation
// would widen every capability back to optional, including the ones this module does implement. The consumer reaches it through a resolver that applies the
// framework's `withDefaults`, which supplies each omitted capability — so there is nothing to stub
// here, and `supports()` can tell a caller which ones are real.
//
// The caller builds the {@link BoilerplateContext} (config + logger) and passes it to each method (ADR-019).
export function createApi() {
  return {
    broadcast: (_context, tx, _options?) => broadcast(tx),
    combine: (_context, tx, signature, options?) => combine(tx, signature, options?.pubkey),
    craftTransaction: (_context, transactionIntent, _options?) => craft(transactionIntent),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    estimateFees: (_context, transactionIntent, _options?) => estimate(transactionIntent),
    getBalance: (context, address, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(context, address), options),
    lastBlock: _context => lastBlock(),
    listOperations: (_context, address, options) => listOperations(address, options),
  } satisfies CoinModuleImpl<BoilerplateCoinConfig>;
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
  const tx = await craftTransaction(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
    },
  );
  return { transaction: tx.serializedTransaction };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const { serializedTransaction } = await craftTransaction(
    { address: transactionIntent.sender },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
    },
  );

  const value = await estimateFees(serializedTransaction);

  return { value };
}
