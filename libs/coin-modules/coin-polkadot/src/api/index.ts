import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  BroadcastConfig,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
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
export function createApi(): CoinModuleApi<PolkadotCoinConfig> {
  return {
    broadcast: async (
      context: PolkadotContext,
      transaction: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ) => {
      const config = await context.config();
      return broadcast(config, transaction, "polkadot");
    },
    async call(_context: PolkadotContext) {
      throw new Error("call is not supported");
    },
    combine: (_context: PolkadotContext) => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: (context, transactionIntent, options) =>
      craft(context, transactionIntent, options?.customFees),
    craftRawTransaction: (
      _context: PolkadotContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (context, transactionIntent) => estimate(context, transactionIntent),
    getBalance: async (context: PolkadotContext, address: string, options?: BalanceOptions) => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address), options);
    },
    lastBlock: async context => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations: (context, address, options) => operations(context, address, options),
    getBlock(_context: PolkadotContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context: PolkadotContext, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(
      _context: PolkadotContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: PolkadotContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(
      _context: PolkadotContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _context: PolkadotContext,
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_context: PolkadotContext, _address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
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
