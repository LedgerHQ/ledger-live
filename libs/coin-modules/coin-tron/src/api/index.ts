import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  AccountInfo,
  Balance,
  BlockInfo,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionValidation,
  Validator,
  BalanceOptions,
  Block,
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type TronContext } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  getBlock,
  getBlockInfo,
  lastBlock,
  listOperations as listOperationsLogic,
  validateAddress,
} from "../logic";
import { validateIntent } from "../logic/validateIntent";
import { defaultFetchParams, getBlock as getBlockNetwork } from "../network";
import type { TronMemo } from "../types";
import type { TronCoinConfig } from "../config";

const MAX_TRONGRID_LIMIT = 200;

export function createApi(): CoinModuleApi<TronCoinConfig, TronMemo> {
  return {
    broadcast: async (context, tx) => {
      const config = await context.config();
      return broadcast(tx, config);
    },
    // Tron contract reads (triggerconstantcontract) are intentionally not supported yet.
    call() {
      throw new Error("call is not supported");
    },
    combine: (_context, tx, signature) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent, options) => {
      const config = await context.config();
      return craftTransaction(transactionIntent, options?.customFees, config);
    },
    craftRawTransaction: (
      _context: TronContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (context, transactionIntent) => {
      const config = await context.config();
      const fees = await estimateFees(transactionIntent, config);
      return { value: fees };
    },
    getAccountInfo: async (context, address): Promise<AccountInfo> => {
      const config = await context.config();
      return getAccountInfo(address, config);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(address, config), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations,
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(height, config);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(height, config);
    },
    getStakes(
      _context: TronContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: TronContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_context: TronContext, _options?: { cursor?: Cursor }): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      context,
      transactionIntent,
      balances,
      options,
    ): Promise<TransactionValidation> => {
      const config = await context.config();
      return validateIntent(transactionIntent, balances, options?.customFees, config);
    },
    // Tron uses (timestamp + ref_block_hash) for replay protection rather than
    // a per-account nonce, so getNextSequence has no meaningful value here.
    getNextSequence: async (_context: TronContext, _address: string) => 0n,
    validateAddress: async (
      _context: TronContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}

async function listOperations(
  context: TronContext,
  address: string,
  { minHeight, order, cursor, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > MAX_TRONGRID_LIMIT) {
    throw new Error(`limit must be <= ${MAX_TRONGRID_LIMIT} for Tron (TronGrid API restriction)`);
  }
  const config = await context.config();
  const effectiveLimit = limit ?? MAX_TRONGRID_LIMIT;
  const effectiveOrder = order ?? "asc";

  let minTimestamp = defaultFetchParams.minTimestamp;
  if (minHeight > 0) {
    // getBlock rejects when minHeight points just past the chain tip (block not yet
    // produced); fall back to the default bound instead of failing the whole listing.
    const block = await getBlockNetwork(minHeight, config).catch(() => null);
    minTimestamp = block?.time?.getTime() ?? defaultFetchParams.minTimestamp;
  }

  return listOperationsLogic(
    address,
    {
      limit: effectiveLimit,
      minTimestamp,
      order: effectiveOrder,
      cursor,
    },
    config,
  );
}
