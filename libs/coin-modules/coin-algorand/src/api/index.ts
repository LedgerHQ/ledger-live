import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  Balance,
  Block,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { AlgorandCoinConfig, AlgorandContext } from "../config";
import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
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

export function createApi(): CoinModuleApi<AlgorandCoinConfig, AlgorandMemo> {
  return {
    broadcast: (context: AlgorandContext, signedTx: string) => broadcast(context, signedTx),
    async call() {
      throw new Error("call is not supported");
    },
    combine: (_context: AlgorandContext, unsignedTx: string, signature: string) =>
      combine(unsignedTx, signature),
    craftTransaction: (
      context: AlgorandContext,
      transactionIntent: TransactionIntent<AlgorandMemo>,
    ) => craftApiTransaction(context, transactionIntent),
    estimateFees: (context: AlgorandContext, _transactionIntent: TransactionIntent<AlgorandMemo>) =>
      estimateFees(context),
    getBalance: (context: AlgorandContext, address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(context, address), options),
    getBlockInfo: (context: AlgorandContext, height: number) => getBlockInfo(context, height),
    lastBlock: (context: AlgorandContext) => lastBlock(context),
    listOperations: (context: AlgorandContext, address: string, options) =>
      listOperations(context, address, options),
    validateIntent: (
      context: AlgorandContext,
      intent: TransactionIntent<AlgorandMemo>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ) => validateIntent(context, intent, balances, options?.customFees),
    getBlock(_context: AlgorandContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported for Algorand");
    },
    getNextSequence(_context: AlgorandContext, _address: string): Promise<bigint> {
      throw new Error("getNextSequence is not applicable for Algorand");
    },
    getStakes(
      _context: AlgorandContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported for Algorand");
    },
    getRewards(
      _context: AlgorandContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported for Algorand");
    },
    getValidators(
      _context: AlgorandContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported for Algorand");
    },
    craftRawTransaction: (
      _context: AlgorandContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported for Algorand");
    },
    validateAddress: (
      _context: AlgorandContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ) => validateAddress(address, parameters),
    craftTransactionData: (_context: AlgorandContext, intent: TransactionIntent) =>
      craftTransactionData(intent),
  };
}
