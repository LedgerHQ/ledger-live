import type {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  BroadcastConfig,
  BufferTxData,
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
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { Operation as LiveOperation } from "@ledgerhq/types-live";
import { EvmCoinConfig, setCoinConfig, type EvmConfig } from "../config";
import { craftTransactionData } from "../logic/craftTransactionData";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextSequence,
  lastBlock,
  listOperations,
  refreshOperations,
  validateIntent,
  validateTransaction,
} from "../logic/index";
import { validateAddress } from "../logic/validateAddress";
import { STAKING_CONTRACTS } from "../staking";
import { getValidatorsPage } from "../staking/validators";

// NOTE Celo still relies on the EVM coin config and injects its own
// while creating an unused instance of API
// TODO Change to Record<string, EvmConfig> once Celo bridge is removed
const configs: Record<string, EvmConfig | (() => EvmCoinConfig)> = {};

export function createApi(
  config: EvmConfig | (() => EvmCoinConfig),
  currencyId: string,
): CoinModuleApi<MemoNotSupported, BufferTxData> & BridgeApi {
  configs[currencyId] = config;
  setCoinConfig(id => {
    const evmConfig = configs[id];
    return typeof evmConfig === "function"
      ? evmConfig()
      : { info: { ...evmConfig, status: { type: "active" } } };
  });
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    combine,
    craftTransaction: (
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(currency, { transactionIntent, customFees }),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(currency, transactionIntent, customFeesParameters),
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      getBalance(currency, address, options),
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> => listOperations(currency, address, options),
    getBlock: (height: number): Promise<Block> => getBlock(currency, height),
    getBlockInfo: (height: number): Promise<BlockInfo> => getBlockInfo(currency, height),
    getStakes(_address: string): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators: (): Promise<Page<Validator>> => getValidatorsPage(currency.id),
    getNextSequence: (address: string): Promise<bigint> => getNextSequence(currency, address),
    validateAddress,
    validateIntent: (
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(currency, intent, balances, customFees),
    /**
     * Only expose this method if the chain has no explorer (the only chain that passes a function
     * is Celo that works with an explorer)
     * Not exposing this methods ensures that we don't try to force the update of pending operations
     * in the context of the generic adapter and wait for explorers more accurate results instead
     */
    ...(typeof config !== "function" && config.explorer.type === "none"
      ? {
          refreshOperations: (operations: LiveOperation[]): Promise<LiveOperation[]> =>
            refreshOperations(currency, operations),
        }
      : {}),
    validateTransaction: (signature: string): Promise<{ error: Error | undefined }> =>
      validateTransaction(currency, { signature }),
    ...(STAKING_CONTRACTS[currencyId] ? { stakingSupported: true } : {}),
    craftTransactionData,
  };
}
