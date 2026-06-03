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
  TxDataNotSupported,
  Validator,
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import coinConfig, { type CardanoConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";

export function createApi(config: CardanoConfig, currencyId: string): CoinModuleApi<StringMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    getBlockInfo: (_height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
    getBlock: (_height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    // cursor ignored: Cardano returns every pool in one page (see getValidators).
    getValidators: (_cursor?: Cursor): Promise<Page<Validator>> => getValidators(currency),
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(() => getBalance(currency, address), options),
    listOperations: (address: string, options: ListOperationsOptions): Promise<Page<Operation>> =>
      listOperations(currency, address, options),
    getStakes: (address: string, cursor?: Cursor): Promise<Page<Stake>> =>
      getStakes(currency, address, cursor),
    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    craftTransaction: (
      transactionIntent: TransactionIntent<StringMemo>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(currency, transactionIntent, customFees),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      transactionIntent: TransactionIntent<StringMemo>,
      _customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(currency, transactionIntent),
    combine,
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    validateIntent: (
      transactionIntent: TransactionIntent<StringMemo>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> =>
      validateIntent(currency, transactionIntent, balances, customFees),
    // Cardano is UTXO-based: no per-account sequence/nonce to advance.
    getNextSequence: (_address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Cardano");
    },
    validateAddress: (
      _address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => {
      throw new Error("validateAddress is not supported");
    },
    craftTransactionData: (_intent: TransactionIntent<StringMemo>): TxDataNotSupported => {
      throw new Error("craftTransactionData is not supported");
    },
  };
}
