import type {
  Balance,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig from "../config";
import type { FilecoinCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getNextSequence } from "../logic/getNextSequence";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

export function createApi(
  config: FilecoinCoinConfig,
  _currencyId?: string,
): CoinModuleApi<MemoNotSupported> {
  coinConfig.setCoinConfig(() => config);

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> => broadcast(tx),

    combine: (tx: string, signature: string, pubkey?: string): string =>
      combine(tx, signature, pubkey),

    craftTransaction: (
      intent: TransactionIntent<MemoNotSupported>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(intent, customFees),

    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },

    estimateFees: (
      intent: TransactionIntent<MemoNotSupported>,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(intent, customFeesParameters),

    getBalance: (address: string, _options?: BalanceOptions): Promise<Balance[]> =>
      getBalance(address),

    lastBlock: (): Promise<BlockInfo> => lastBlock(),

    listOperations: (
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> => listOperations(address, options),

    getBlock: (_height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },

    getBlockInfo: (_height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },

    getStakes: (_address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },

    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },

    getValidators: (_cursor?: Cursor): Promise<Page<Validator>> => {
      throw new Error("getValidators is not supported");
    },

    validateAddress: (address: string, parameters) => validateAddress(address, parameters),

    validateIntent: (
      intent: TransactionIntent<MemoNotSupported>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(intent, balances, customFees),

    getNextSequence: (address: string): Promise<bigint> => getNextSequence(address),

    craftTransactionData,
  };
}
