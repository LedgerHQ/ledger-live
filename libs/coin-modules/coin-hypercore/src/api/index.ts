import {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
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
} from "@ledgerhq/coin-module-framework/api/types";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { type HyperCoreCoinConfig } from "../config";
import { getBalance } from "../logic/getBalance";

const notSupported = (method: string) => () => {
  throw new Error(`${method} is not supported`);
};

/**
 * Read-only coin-module API for HyperCore L1.
 *
 * Only `getBalance` is implemented (returns the native HYPE spot balance).
 * Signing/crafting/broadcast are intentionally not implemented — the EVM device
 * app is expected to be used when those flows are added later.
 */
export function createApi(config: HyperCoreCoinConfig, currencyId?: string): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    getBalance: (address: string): Promise<Balance[]> => getBalance(address, currencyId),

    lastBlock: async (): Promise<BlockInfo> => ({ height: 0, hash: "", time: new Date() }),

    listOperations: async (
      _address: string,
      _options: ListOperationsOptions,
    ): Promise<Page<Operation>> => ({ items: [] }),

    broadcast: notSupported("broadcast") as (tx: string) => Promise<string>,
    combine: notSupported("combine") as (tx: string, signature: string, pubkey?: string) => string,
    craftTransaction: notSupported("craftTransaction") as (
      _transactionIntent: TransactionIntent,
      _customFees?: FeeEstimation,
    ) => Promise<CraftedTransaction>,
    craftRawTransaction: notSupported("craftRawTransaction") as (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ) => Promise<CraftedTransaction>,
    estimateFees: notSupported("estimateFees") as (
      _transactionIntent: TransactionIntent,
    ) => Promise<FeeEstimation>,
    getBlock: notSupported("getBlock") as (_height: number) => Promise<Block>,
    getBlockInfo: notSupported("getBlockInfo") as (_height: number) => Promise<BlockInfo>,
    getStakes: notSupported("getStakes") as (
      _address: string,
      _cursor?: Cursor,
    ) => Promise<Page<Stake>>,
    getRewards: notSupported("getRewards") as (
      _address: string,
      _cursor?: Cursor,
    ) => Promise<Page<Reward>>,
    getValidators: notSupported("getValidators") as (
      _cursor?: Cursor,
    ) => Promise<Page<Validator>>,
    validateIntent: notSupported("validateIntent") as (
      _transactionIntent: TransactionIntent,
      _balances: Balance[],
      _customFees?: FeeEstimation,
    ) => Promise<TransactionValidation>,
    getNextSequence: notSupported("getNextSequence") as (_address: string) => Promise<bigint>,
    validateAddress: notSupported("validateAddress") as (
      _address: string,
      _parameters: Partial<{ currencyId: string; networkId: number }>,
    ) => Promise<boolean>,
    craftTransactionData,
  };
}
