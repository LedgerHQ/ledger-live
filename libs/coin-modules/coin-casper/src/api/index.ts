import type {
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { setCoinConfig } from "../config";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import type { CasperCoinConfig } from "../types";

export function createApi(config: CasperCoinConfig): CoinModuleApi<MemoNotSupported> {
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
    getBalance(_address: string, _options?: BalanceOptions) {
      throw new Error("getBalance is not supported");
    },
    listOperations,
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    craftTransaction(_intent: TransactionIntent<MemoNotSupported>): Promise<CraftedTransaction> {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction(
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees(_intent: TransactionIntent<MemoNotSupported>): Promise<FeeEstimation> {
      throw new Error("estimateFees is not supported");
    },
    combine(_tx: string, _signature: string, _pubkey?: string): string {
      throw new Error("combine is not supported");
    },
    broadcast(_tx: string): Promise<string> {
      throw new Error("broadcast is not supported");
    },
    validateIntent(
      _intent: TransactionIntent<MemoNotSupported>,
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
    craftTransactionData(_intent: TransactionIntent<MemoNotSupported>) {
      throw new Error("craftTransactionData is not supported");
    },
  };
}
