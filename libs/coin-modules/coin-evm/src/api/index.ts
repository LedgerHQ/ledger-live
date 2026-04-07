import type {
  BroadcastConfig,
  Balance,
  Block,
  BlockInfo,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  TransactionIntent,
  Cursor,
  Page,
  Validator,
  Stake,
  Reward,
  TransactionValidation,
  CraftedTransaction,
  BufferTxData,
  AlpacaApi,
} from "@ledgerhq/coin-module-framework/api/index";
import { STAKING_CONTRACTS } from "../staking";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { Operation as LiveOperation } from "@ledgerhq/types-live";
import { EvmCoinConfig, setCoinConfig, type EvmConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  lastBlock,
  listOperations,
  getBalance,
  getNextSequence,
  validateIntent,
  refreshOperations,
  getBlock,
  getBlockInfo,
  validateTransaction,
} from "../logic/index";
import { validateAddress } from "../logic/validateAddress";

// NOTE Celo still relies on the EVM coin config and injects its own
// while creating an unused instance of API
// TODO Change to Record<string, EvmConfig> once Celo bridge is removed
const configs: Record<string, EvmConfig | (() => EvmCoinConfig)> = {};

export function createApi(
  config: EvmConfig | (() => EvmCoinConfig),
  currencyId: string,
): AlpacaApi<MemoNotSupported, BufferTxData> &
  BridgeApi & {
    validateTransaction: (signature: string) => Promise<{ error: Error | undefined }>;
  } {
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
    getBalance: (address: string): Promise<Balance[]> => getBalance(currency, address),
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
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
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
  };
}
