import type {
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
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
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { setCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { lastBlock } from "../logic/lastBlock";
import { getBalance as getAccountBalance } from "../logic/getBalance";
import { listOperations } from "../logic/listOperations";
import { estimateFees } from "../logic/estimateFees";
import type { CasperCoinConfig, CasperMemo } from "../types";

export function createApi(config: CasperCoinConfig): CoinModuleApi<CasperMemo> {
  setCoinConfig(config);

  return {
    lastBlock,
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getBlock(_height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    async call() {
      throw new Error("call is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    getBalance(address: string, options?: BalanceOptions): Promise<Balance[]> {
      return rejectBalanceOptions(() => getAccountBalance(address), options);
    },
    listOperations,
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    craftTransaction,
    craftRawTransaction(
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> {
      throw new Error("craftRawTransaction is not supported");
    },
    combine,
    broadcast,
    estimateFees,
    validateIntent(
      _intent: TransactionIntent<CasperMemo>,
      _balances: Balance[],
      _customFees?: FeeEstimation,
    ): Promise<TransactionValidation> {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence(_address: string): Promise<bigint> {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress(_address: string, _parameters: unknown): Promise<boolean> {
      throw new Error("validateAddress is not supported");
    },
    craftTransactionData(_intent: TransactionIntent<CasperMemo>) {
      throw new Error("craftTransactionData is not supported");
    },
  };
}
