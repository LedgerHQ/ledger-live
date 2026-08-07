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
// `context.config()` and threads it explicitly into the network/logic layers (`network/sdk.ts`).
// The network layer keeps its `getCoinConfig()` singleton fallback for the classic bridge; the
// captured `currencyId` is forwarded from this closure for chain selection — it is not read off
// the threaded context.
export function createApi(currencyId: string): CoinModuleApi<SuiCoinConfig> {
  return {
    broadcast: async (context, tx) => {
      const config = await context.config();
      return broadcast(tx, currencyId, config);
    },
    async call() {
      throw new Error("call is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent) => {
      const config = await context.config();
      return craft(transactionIntent, config);
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
      return estimate(transactionIntent, config);
    },
    getBalance: async (context, address, options?: BalanceOptions) => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(address, currencyId, config), options);
    },
    lastBlock: async context => {
      const config = await context.config();
      return lastBlock(currencyId, config);
    },
    getBlock: async (context, height) => {
      const config = await context.config();
      return getBlock(height, currencyId, config);
    },
    getBlockInfo: async (context, height) => {
      const config = await context.config();
      return getBlockInfo(height, currencyId, config);
    },
    listOperations: async (context, address, options) => {
      const config = await context.config();
      return logicListOperations(address, options, currencyId, config);
    },
    getStakes: async (context, address, options) => {
      const config = await context.config();
      return getStakes(address, options?.cursor, currencyId, config);
    },
    getRewards: async (_context, address, options) => {
      return getRewards(address, options?.cursor);
    },
    getValidators: async (context, options) => {
      const config = await context.config();
      return logicGetValidators(options?.cursor, currencyId, config);
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
  transactionIntent: TransactionIntent,
  config?: SuiCoinConfig,
): Promise<CraftedTransaction> {
  const { unsigned, objects, resolution } = await craftTransaction(
    transactionIntent,
    true,
    undefined,
    config,
  );

  return {
    transaction: Buffer.from(unsigned).toString("hex"),
    details: {
      objects: objects?.map(obj => Buffer.from(obj).toString("hex")),
      ...(resolution
        ? { resolution: Buffer.from(JSON.stringify(resolution)).toString("hex") }
        : {}),
    },
  };
}

async function estimate(
  transactionIntent: TransactionIntent,
  config?: SuiCoinConfig,
): Promise<FeeEstimation> {
  // The framework's FeeEstimation is the positive gas reservation (budget); the net dry-run `fees`
  // can be negative on a storage rebate, which this contract does not expect. The bridge path uses
  // the accurate `fees` for the optimistic-op value instead.
  const { gasBudget } = await estimateFees(transactionIntent, config);
  return { value: gasBudget };
}
