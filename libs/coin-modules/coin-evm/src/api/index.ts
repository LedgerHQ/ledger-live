import {
  type Api,
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
  AssetInfo,
  CraftedTransaction,
  BufferTxData,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig, Operation as LiveOperation } from "@ledgerhq/types-live";
import { EvmCoinConfig, setCoinConfig, type EvmConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  lastBlock,
  listOperations,
  getBalance,
  getSequence,
  validateIntent,
  getTokenFromAsset,
  getAssetFromToken,
  computeIntentType,
  refreshOperations,
  getBlock,
  getBlockInfo,
} from "../logic/index";

// NOTE Celo still relies on the EVM coin config and injects its own
// while creating an unused instance of API
// TODO Change to Record<string, EvmConfig> once Celo bridge is removed
const configs: Record<string, EvmConfig | (() => EvmCoinConfig)> = {};

export function createApi(
  config: EvmConfig | (() => EvmCoinConfig),
  currencyId: string,
): Api<MemoNotSupported, BufferTxData> {
  configs[currencyId] = config;
  setCoinConfig(c => {
    const evmConfig = configs[c.id];
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
    listOperations: async (
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
    getSequence: (address: string): Promise<bigint> => getSequence(currency, address),
    validateIntent: (
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(currency, intent, balances, customFees),
    getTokenFromAsset: (asset: AssetInfo): Promise<TokenCurrency | undefined> =>
      getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string): AssetInfo =>
      getAssetFromToken(currency, token, owner),
    computeIntentType,
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
  };
}
