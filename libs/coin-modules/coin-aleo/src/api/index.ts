import type {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
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
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import { estimateFees, getBalance, lastBlock, listOperations, validateAddress } from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoCoinConfig, AleoConfig, AleoTransactionIntentData } from "../types";

export function createApi(
  config: AleoConfig,
  currencyId: string,
): CoinModuleApi<MemoNotSupported, AleoTransactionIntentData> {
  const aleoCoinConfig: AleoCoinConfig = { ...config, status: { type: "active" } };
  coinConfig.setCoinConfig(() => aleoCoinConfig);
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (_signature: string): Promise<string> => {
      throw new Error("broadcast is not supported");
    },
    combine: (_transaction: string, _signature: string, _publicKey: string | undefined): string => {
      throw new Error("combine is not supported");
    },
    craftTransaction: async (
      _txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      _customFees?: FeeEstimation,
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
    estimateFees: async (intent): Promise<FeeEstimation> => {
      const transactionType = getTransactionType(intent);
      return estimateFees({ configOrCurrencyId: aleoCoinConfig, transactionType });
    },
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> => {
      return rejectBalanceOptions(() => getBalance(currency, address), options);
    },
    lastBlock: async (): Promise<BlockInfo> => {
      return lastBlock(currency);
    },
    listOperations: async (address, options) => {
      const { operations, nextCursor } = await listOperations({
        currency,
        address,
        options,
        mode: "coin-framework",
      });

      return { items: operations, next: nextCursor ?? undefined };
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
    craftTransactionData,
  };
}
