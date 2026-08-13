import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  BalanceOptions,
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
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import BigNumber from "bignumber.js";
import { type BoilerplateCoinConfig, type BoilerplateContext } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../logic";

// The caller builds the {@link BoilerplateContext} (config + logger) and passes it to each method (ADR-019).
export function createApi(): CoinModuleApi<BoilerplateCoinConfig> {
  return {
    broadcast: (_context, tx) => broadcast(tx),
    async call() {
      throw new Error("call is not supported");
    },
    combine: (_context, tx, signature, options) => combine(tx, signature, options?.pubkey),
    craftTransaction: (_context, transactionIntent) => craft(transactionIntent),
    craftRawTransaction: (
      _context: BoilerplateContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (_context, transactionIntent) => estimate(transactionIntent),
    getBalance: (context, address, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(context, address), options),
    lastBlock: _context => lastBlock(),
    listOperations: (_context, address, options) => listOperations(address, options),
    getBlock(_context, _height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_context, _options?: { cursor?: Cursor }): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: async (
      _context: BoilerplateContext,
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_context: BoilerplateContext, _address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: async (_context: BoilerplateContext, _address: string) => {
      throw new Error("validateAddress is not supported");
    },
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
  const tx = await craftTransaction(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
    },
  );
  return { transaction: tx.serializedTransaction };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const { serializedTransaction } = await craftTransaction(
    { address: transactionIntent.sender },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
    },
  );

  const value = await estimateFees(serializedTransaction);

  return { value };
}
