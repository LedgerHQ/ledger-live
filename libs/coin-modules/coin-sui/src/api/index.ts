import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  BalanceOptions,
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import { type SuiCoinConfig, type SuiContext } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  getRewards,
  getStakes,
  lastBlock,
  getValidators as logicGetValidators,
  listOperations as logicListOperations,
} from "../logic";

// In the {@link SuiContext}-based API (ADR-019) each method resolves its coin configuration from
// `context.config()` and threads it explicitly (as the required first argument) into the
// network/logic layers (`network/sdk.ts`), which derive the chain from `config.node`.
export function createApi(): CoinModuleApi<SuiCoinConfig> {
  return {
    broadcast: async (context, tx) => {
      const config = await context.config();
      return broadcast(config, tx);
    },
    async call() {
      throw new Error("call is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent) => {
      const config = await context.config();
      return craft(config, transactionIntent);
    },
    craftRawTransaction: (
      _context: SuiContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (context, transactionIntent) => {
      const config = await context.config();
      return estimate(config, transactionIntent);
    },
    getBalance: async (context, address, options?: BalanceOptions) => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address), options);
    },
    lastBlock: async context => {
      const config = await context.config();
      return lastBlock(config);
    },
    getBlock: async (context, height) => {
      const config = await context.config();
      return getBlock(config, height);
    },
    getBlockInfo: async (context, height) => {
      const config = await context.config();
      return getBlockInfo(config, height);
    },
    listOperations: async (context, address, options) => {
      const config = await context.config();
      return logicListOperations(config, address, options);
    },
    getStakes: async (context, address, options) => {
      const config = await context.config();
      return getStakes(config, address, options?.cursor);
    },
    getRewards: async (_context, address, options) => {
      return getRewards(address, options?.cursor);
    },
    getValidators: async (context, options) => {
      const config = await context.config();
      return logicGetValidators(config, options?.cursor);
    },
    validateIntent: async (): Promise<never> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (): Promise<never> => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}

async function craft(
  config: SuiCoinConfig,
  transactionIntent: TransactionIntent,
): Promise<CraftedTransaction> {
  const { unsigned, objects, resolution } = await craftTransaction(
    config,
    transactionIntent,
    true,
    undefined,
  );

  return {
    transaction: Buffer.from(unsigned).toString("hex"),
    details: {
      objects: objects?.map(obj => Buffer.from(obj).toString("hex")),
      ...(resolution
        ? {
            resolution: Buffer.from(JSON.stringify(resolution)).toString("hex"),
          }
        : {}),
    },
  };
}

async function estimate(
  config: SuiCoinConfig,
  transactionIntent: TransactionIntent,
): Promise<FeeEstimation> {
  // The framework's FeeEstimation is the positive gas reservation (budget); the net dry-run `fees`
  // can be negative on a storage rebate, which this contract does not expect. The bridge path uses
  // the accurate `fees` for the optimistic-op value instead.
  const { gasBudget } = await estimateFees(config, transactionIntent);
  return { value: gasBudget };
}
