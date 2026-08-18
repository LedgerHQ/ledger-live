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
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type KaspaCoinConfig, type KaspaContext } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  lastBlock,
  listOperations,
  validateIntent,
} from "../logic";

/**
 * Alpaca (CoinModuleApi) factory for native KAS. Kaspa is a UTXO / BlockDAG PoW chain: no
 * per-account nonce, no native staking, no in-module token standard (see
 * `src/supportedFeatures.ts` — `blockchain_txs: ["send"]`), so the account-model and
 * staking/token methods below throw rather than return misleading data, mirroring
 * `coin-cardano`'s UTXO adaptation of the same interface.
 */
export function createApi(): CoinModuleApi<KaspaCoinConfig> {
  return {
    // --- Blocks / chain state ---
    lastBlock: (_context: KaspaContext): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (_context: KaspaContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(height),
    getBlock: (_context: KaspaContext, height: number): Promise<Block> => getBlock(height),

    // --- Account state ---
    getBalance: (
      _context: KaspaContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (
      _context: KaspaContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(address, options),

    // --- Transaction lifecycle ---
    craftTransaction: (
      _context: KaspaContext,
      transactionIntent: TransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, options?.customFees),
    estimateFees: (
      _context: KaspaContext,
      transactionIntent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> => estimateFees(transactionIntent, options?.customFeesParameters),
    combine: (
      _context: KaspaContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ): string => combine(tx, signature),
    broadcast: (
      _context: KaspaContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(tx, options?.broadcastConfig),
    validateIntent: (
      _context: KaspaContext,
      transactionIntent: TransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(transactionIntent, balances, options?.customFees),
    craftTransactionData: (_context: KaspaContext, intent: TransactionIntent) =>
      craftTransactionData(intent),

    // --- Not applicable to Kaspa's UTXO model ---
    // No per-account sequence/nonce (replay protection comes from spending one-time UTXOs); no
    // raw-transaction craft; on-device address validation is not exposed through this API.
    getNextSequence: (_context: KaspaContext, _address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Kaspa");
    },
    craftRawTransaction: (
      _context: KaspaContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    validateAddress: (
      _context: KaspaContext,
      _address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => {
      throw new Error("validateAddress is not supported");
    },

    // --- Not supported: no native staking, no in-module token standard (blockchain_txs: ["send"]) ---
    call: async (_context: KaspaContext) => {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    getStakes: (
      _context: KaspaContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: (
      _context: KaspaContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    getValidators: (
      _context: KaspaContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },
  };
}
