import type {
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
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import invariant from "invariant";
import coinConfig, { type AleoCoinConfig, type AleoConfig } from "../config";
import { craftTransaction, estimateFees, getBalance, lastBlock, listOperations } from "../logic";
import { getTransactionType } from "../logic/utils";
import type { AleoTransactionIntentData } from "../types";

export function createApi(config: AleoConfig, currencyId: string): Api {
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
      txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => {
      // fees are handled by txIntent of type fee_public or fee_private
      invariant(!customFees, "customFees are not supported");
      invariant(!txIntent.useAllAmount, "useAllAmount is not supported yet");

      return craftTransaction({ currency, txIntent });
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
    getBalance: (address: string): Promise<Balance[]> => {
      return getBalance(currency, address);
    },
    lastBlock: async (): Promise<BlockInfo> => {
      return lastBlock(currency);
    },
    listOperations: async (address, options) => {
      const { operations, nextCursor } = await listOperations({
        currency,
        address,
        options,
        mode: "alpaca",
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
    getSequence: async (_address: string) => {
      throw new Error("getSequence is not supported");
    },
  };
}
