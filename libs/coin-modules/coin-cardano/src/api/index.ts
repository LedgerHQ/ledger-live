import type {
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
  StringMemo,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { type CardanoCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

type CardanoContext = Context<CardanoCoinConfig>;

export function createApi(currencyId: string): CoinModuleApi<CardanoCoinConfig, StringMemo> {
  const currency = getCryptoCurrencyById(currencyId);

  return {
    async call() {
      throw new Error("call is not supported");
    },
    lastBlock: (_context: CardanoContext): Promise<BlockInfo> => lastBlock(currency),
    getBlockInfo: (_context: CardanoContext, _height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
    getBlock: (_context: CardanoContext, _height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    // cursor ignored: Cardano returns every pool in one page (see getValidators).
    getValidators: (
      _context: CardanoContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => getValidators(currency),
    getBalance: (
      _context: CardanoContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(currency, address), options),
    listOperations: (
      _context: CardanoContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(currency, address, options),
    getStakes: (
      _context: CardanoContext,
      address: string,
      options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> => getStakes(currency, address, options?.cursor),
    getRewards: (
      _context: CardanoContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    craftTransaction: (
      _context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(currency, transactionIntent, options?.customFees),
    craftRawTransaction: (
      _context: CardanoContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      _context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      _options?: { feeOption?: unknown },
    ): Promise<FeeEstimation> => estimateFees(currency, transactionIntent),
    combine: (
      _context: CardanoContext,
      tx: string,
      signature: string,
      options?: { pubkey?: string },
    ) => combine(tx, signature, options?.pubkey),
    broadcast: (
      _context: CardanoContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig: options?.broadcastConfig }),
    validateIntent: (
      _context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(currency, transactionIntent, balances, options?.customFees),
    // Cardano is UTXO-based: no per-account sequence/nonce to advance.
    getNextSequence: (_context: CardanoContext, _address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Cardano");
    },
    validateAddress: (_context: CardanoContext, ...args: Parameters<typeof validateAddress>) =>
      validateAddress(...args),
    craftTransactionData: (
      _context: CardanoContext,
      ...args: Parameters<typeof craftTransactionData>
    ) => craftTransactionData(...args),
  };
}
