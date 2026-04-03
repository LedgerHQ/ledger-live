import {
  AlpacaApi,
  Balance,
  Block,
  BlockInfo,
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
} from "@ledgerhq/coin-module-framework/api/index";
import { validateAddress } from "../bridge/validateAddress";
import { combine } from "../common-logic/transaction/combine";
import coinConfig, { type CantonCoinConfig } from "../config";

export function createApi(config: CantonCoinConfig): AlpacaApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (_tx: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine,
    craftTransaction(_transactionIntent: TransactionIntent, _customFees?: FeeEstimation) {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees(_transactionIntent: TransactionIntent): Promise<FeeEstimation> {
      throw new Error("estimateFees is not supported");
    },
    getBalance(_address: string): Promise<Balance[]> {
      throw new Error("getBalance is not supported");
    },
    lastBlock(): Promise<BlockInfo> {
      throw new Error("listOperations is not supported");
    },
    listOperations(_address: string, _options: ListOperationsOptions): Promise<Page<Operation>> {
      throw new Error("listOperations is not supported");
    },
    getBlock(_height): Promise<Block> {
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
  };
}
