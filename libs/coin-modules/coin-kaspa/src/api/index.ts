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
    lastBlock: (): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (_height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
    getBlock: (_height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getValidators: (_cursor?: Cursor): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (address: string, options: ListOperationsOptions): Promise<Page<Operation>> =>
      listOperations(address, options),
    getStakes: (_address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    craftTransaction: (
      transactionIntent: TransactionIntent,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, customFees),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
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
    // Kaspa is UTXO-based: no per-account sequence/nonce to advance.
    getNextSequence: (_address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Kaspa");
    },
    validateAddress: (
      _address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => {
      throw new Error("validateAddress is not supported");
    },
    craftTransactionData,
  };
}
