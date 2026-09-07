import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  CoinModuleImpl,
  BroadcastConfig,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionIntent,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { PolkadotCoinConfig, PolkadotContext } from "../config";
import {
  broadcast,
  craftEstimationTransaction,
  craftTransaction,
  defaultExtrinsicArg,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";
import { validateAddress } from "../logic/validateAddress";

// The caller builds the PolkadotContext and passes it to each method (ADR-019). Each method resolves
// config via `await context.config()` and threads it as the required first argument down through the
// logic/network layers, so the currency-keyed singleton is no longer used on the api path.
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed: `call`, `register`, `craftRawTransaction`, `getBlock`, `getBlockInfo`,
// `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence`. The consumer
// resolver applies `withDefaults`, which answers "not supported" for each.
//
// `combine` stays and keeps throwing: it is a required method, so it cannot be omitted — the device
// signature is attached by the signer rather than here.
export function createApi() {
  return {
    broadcast: async (
      context: PolkadotContext,
      transaction: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ) => {
      const config = await context.config();
      return broadcast(config, transaction, "polkadot");
    },
    combine: (
      _context: PolkadotContext,
      _tx: string,
      _signature: string[],
      _options?: { pubkey?: string },
    ) => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: (context, transactionIntent, options?) =>
      craft(context, transactionIntent, options?.customFees),
    estimateFees: (context, transactionIntent, _options?) => estimate(context, transactionIntent),
    getBalance: async (context: PolkadotContext, address: string, options?: BalanceOptions) => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address), options);
    },
    lastBlock: async context => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations: (context, address, options) => operations(context, address, options),
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<PolkadotCoinConfig>;
}

async function craft(
  context: PolkadotContext,
  transactionIntent: TransactionIntent,
  _customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const config = await context.config();
  const extrinsicArg = defaultExtrinsicArg(transactionIntent.amount, transactionIntent.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = 0;
  const tx = await craftTransaction(config, transactionIntent.sender, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return { transaction: extrinsic.toHex() };
}

async function estimate(
  context: PolkadotContext,
  transactionIntent: TransactionIntent,
): Promise<FeeEstimation> {
  const config = await context.config();
  const tx = await craftEstimationTransaction(
    config,
    transactionIntent.sender,
    transactionIntent.amount,
  );
  const value = await estimateFees(config, tx);
  return { value };
}

async function operations(
  context: PolkadotContext,
  address: string,
  { minHeight }: ListOperationsOptions,
): Promise<Page<Operation>> {
  const config = await context.config();
  // FIXME Options are ignored here
  const [items, nextHeight] = await listOperations(config, address, {
    limit: 0,
    startAt: minHeight,
  });
  return { items, next: nextHeight !== null ? JSON.stringify(nextHeight) : undefined };
}
