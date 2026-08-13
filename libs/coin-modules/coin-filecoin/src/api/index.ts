import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleApi,
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
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type FilecoinCoinConfig, type FilecoinContext } from "../config";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

export function createApi(): CoinModuleApi<FilecoinCoinConfig> {
  return {
    broadcast: (
      _context: FilecoinContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(tx, options?.broadcastConfig),

    async call(_context: FilecoinContext) {
      throw new Error("call is not supported");
    },

    combine: (
      _context: FilecoinContext,
      tx: string,
      signature: string,
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),

    craftTransaction: (
      _context: FilecoinContext,
      intent: TransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => craftTransaction(intent, options?.customFees),

    estimateFees: (
      _context: FilecoinContext,
      intent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> => estimateFees(intent, options?.customFeesParameters),

    lastBlock: (_context: FilecoinContext) => lastBlock(),

    listOperations: (
      _context: FilecoinContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(address, options),

    validateIntent: (
      _context: FilecoinContext,
      intent: TransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => validateIntent(intent, balances, options?.customFees),

    getNextSequence: (_context: FilecoinContext, address: string): Promise<bigint> =>
      getNextSequence(address),

    validateAddress: (
      _context: FilecoinContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),

    craftTransactionData: (_context: FilecoinContext, intent: TransactionIntent) =>
      craftTransactionData(intent),

    getBalance: (
      _context: FilecoinContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(address), options),

    craftRawTransaction: (
      _context: FilecoinContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },

    getBlock(_context: FilecoinContext, _height: number): Promise<Block> {
      throw new Error("getBlock is not supported");
    },

    getBlockInfo(_context: FilecoinContext, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },

    getStakes(
      _context: FilecoinContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },

    getRewards(
      _context: FilecoinContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },

    getValidators(
      _context: FilecoinContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
  };
}
