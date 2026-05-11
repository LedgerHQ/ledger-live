import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  Block,
  CraftedTransaction,
  Cursor,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { type AlgorandCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftApiTransaction,
  estimateFees,
  getBalance,
  getBlockInfo,
  lastBlock,
  listOperations,
  validateIntent,
} from "../logic";
import type { AlgorandMemo } from "../types";
import { validateAddress } from "../validateAddress";

export function createApi(config: AlgorandCoinConfig): CoinModuleApi<AlgorandMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craftApiTransaction,
    estimateFees: (_transactionIntent: TransactionIntent<AlgorandMemo>) => estimateFees(),
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    getBlockInfo,
    lastBlock,
    listOperations,
    validateIntent,
    getBlock(_height: number): Promise<Block> {
      throw new Error("getBlock is not supported for Algorand");
    },
    getNextSequence(_address: string): Promise<bigint> {
      throw new Error("getNextSequence is not applicable for Algorand");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported for Algorand");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported for Algorand");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported for Algorand");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported for Algorand");
    },
    validateAddress,
    craftTransactionData,
  };
}
