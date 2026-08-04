import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  CoinModuleApi,
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
import { setCoinConfig, type VechainCoinConfig } from "../config";
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
  validateAddress,
  validateIntent,
} from "../logic";

// CoinModuleApi (Alpaca) factory for VET + VTHO. `config` is re-wrapped to force `status: active`.
export function createApi(config: VechainCoinConfig, _currencyId: string): CoinModuleApi {
  setCoinConfig(() => ({ ...config(), status: { type: "active" } }));

  return {
    lastBlock,
    getBlockInfo,
    getBlock,
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(() => getBalance(address), options),
    listOperations,
    craftTransaction: (
      transactionIntent: TransactionIntent,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, customFees),
    estimateFees: (
      transactionIntent: TransactionIntent,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(transactionIntent, customFeesParameters),
    combine,
    broadcast,
    validateIntent: (
      transactionIntent: TransactionIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(transactionIntent, balances, customFees),
    craftTransactionData,
    validateAddress: (
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    // --- Not applicable / not supported for VeChain ---
    getNextSequence: (_address: string): Promise<bigint> => {
      throw new Error("getNextSequence is not applicable for Vechain");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    call: () => {
      throw new Error("call is not supported");
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
  };
}
