import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  Balance,
  BalanceOptions,
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { validateAddress } from "../bridge/validateAddress";
import coinConfig, { type SuiConfig } from "../config";
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

export function createApi(config: SuiConfig): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (tx: string) => broadcast(tx),
    combine,
    craftTransaction: craft,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    lastBlock,
    getBlock,
    getBlockInfo,
    listOperations: logicListOperations,
    getStakes,
    getRewards,
    getValidators: logicGetValidators,
    validateIntent: async (
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress,
    craftTransactionData,
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const { unsigned, objects, resolution } = await craftTransaction(transactionIntent, true);

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

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  // The framework's FeeEstimation is the positive gas reservation (budget); the net dry-run `fees`
  // can be negative on a storage rebate, which this contract does not expect. The bridge path uses
  // the accurate `fees` for the optimistic-op value instead.
  const { gasBudget } = await estimateFees(transactionIntent);
  return { value: gasBudget };
}
