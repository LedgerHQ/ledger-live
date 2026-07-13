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
import coinConfig, { type KaspaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlock } from "../logic/getBlock";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";

/**
 * Alpaca (CoinModuleApi) factory for native KAS. Kaspa is a UTXO / BlockDAG PoW chain: no
 * per-account nonce, no native staking, no in-module token standard (see
 * `src/supportedFeatures.ts` — `blockchain_txs: ["send"]`), so the account-model and
 * staking/token methods below throw rather than return misleading data, mirroring
 * `coin-cardano`'s UTXO adaptation of the same interface.
 */
export function createApi(config: KaspaCoinConfig, _currencyId: string): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    // --- Blocks / chain state ---
    lastBlock: (): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (height: number): Promise<BlockInfo> => getBlockInfo(height),
    getBlock: (height: number): Promise<Block> => getBlock(height),

    // --- Account state ---
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (address: string, options: ListOperationsOptions): Promise<Page<Operation>> =>
      listOperations(address, options),

    // --- Transaction lifecycle ---
    craftTransaction: (
      transactionIntent: TransactionIntent,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, customFees),
    estimateFees: (
      transactionIntent: TransactionIntent,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(transactionIntent, customFeesParameters),
    combine,
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(tx, broadcastConfig),
    validateIntent: (
      transactionIntent: TransactionIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(transactionIntent, balances, customFees),
    craftTransactionData,

    // --- Not applicable to Kaspa's UTXO model ---
    // No per-account sequence/nonce (replay protection comes from spending one-time UTXOs); no
    // raw-transaction craft; on-device address validation is not exposed through this API.
    getNextSequence: (_address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Kaspa");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    validateAddress: (
      _address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => {
      throw new Error("validateAddress is not supported");
    },

    // --- Not supported: no native staking, no in-module token standard (blockchain_txs: ["send"]) ---
    getStakes: (_address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    getValidators: (_cursor?: Cursor): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },
  };
}
