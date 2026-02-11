import {
  Api,
  Block,
  BlockInfo,
  Cursor,
  Page,
  Stake,
  Reward,
  Validator,
  CraftedTransaction,
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
  ListOperationsOptions,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type AleoConfig } from "../config";

export function createApi(config: AleoConfig, _currencyId: string): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (_signature: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine: (_transaction: string, _signature: string, _publicKey: string | undefined): string => {
      throw new Error("combine is not supported");
    },
    craftTransaction: async (
      _account: unknown,
      _transaction: unknown,
    ): Promise<CraftedTransaction> => {
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
    estimateFees: async (): Promise<FeeEstimation> => {
      throw new Error("estimateFees is not supported");
    },
    getBalance: (_address: string): Promise<Balance[]> => {
      throw new Error("getBalance is not supported");
    },
    lastBlock: async (): Promise<BlockInfo> => {
      throw new Error("lastBlock is not supported");
    },
    listOperations: async (_address: string, _options: ListOperationsOptions) => {
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
    getSequence: async (_address: string) => {
      throw new Error("getSequence is not supported");
    },
  };
}
