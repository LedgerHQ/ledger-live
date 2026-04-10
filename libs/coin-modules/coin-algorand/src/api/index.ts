import {
  AlpacaApi,
  Block,
  CraftedTransaction,
  Cursor,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
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

export function createApi(config: AlgorandCoinConfig): AlpacaApi<AlgorandMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craftApiTransaction,
    estimateFees: (_transactionIntent: TransactionIntent<AlgorandMemo>) => estimateFees(),
    getBalance,
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
