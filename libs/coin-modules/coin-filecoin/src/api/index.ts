import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  type CoinModuleApi,
  type Block,
  type BlockInfo,
  type CraftedTransaction,
  type Cursor,
  type FeeEstimation,
  type Page,
  type Reward,
  type Stake,
  type TransactionIntent,
  type Validator,
  type BalanceOptions,
  type AddressValidationCurrencyParameters,
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
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
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
    estimateFees,
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(address), options),
    lastBlock,
    listOperations,
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
    validateIntent,
    getNextSequence: (address: string) => getNextSequence(address),
    validateAddress: (address: string, parameters: Partial<AddressValidationCurrencyParameters>) =>
      validateAddress(address, parameters),
    craftTransactionData,
  };
}

// Backward compatibility: re-export network functions for existing bridge/common-logic imports
export * from "./api";
