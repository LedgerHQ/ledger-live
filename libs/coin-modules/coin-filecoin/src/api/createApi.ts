import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { type FilecoinCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextSequence,
  lastBlock,
  listOperations,
  validateAddress,
  validateIntent,
} from "../logic";

export function createApi(config: FilecoinCoinConfig): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" as const } }));

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => broadcast(tx, broadcastConfig),

    combine: (tx: string, signature: string, pubkey?: string) => combine(tx, signature, pubkey),

    craftTransaction: (intent: TransactionIntent, customFees?: FeeEstimation) =>
      craftTransaction(intent, customFees),

    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },

    estimateFees: (intent: TransactionIntent, customFeesParameters?: FeeEstimation["parameters"]) =>
      estimateFees(intent, customFeesParameters),

    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),

    lastBlock: () => lastBlock(),

    listOperations: (address: string, options) => listOperations(address, options),

    getBlock(_height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },

    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },

    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },

    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },

    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },

    validateIntent: (
      intent: TransactionIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(intent, balances, customFees),

    getNextSequence: (address: string) => getNextSequence(address),

    validateAddress: (address: string, parameters) => validateAddress(address, parameters),

    craftTransactionData,
  };
}
