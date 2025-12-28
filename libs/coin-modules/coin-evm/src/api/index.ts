import {
  type Api,
  Balance,
  Block,
  BlockInfo,
  FeeEstimation,
  MemoNotSupported,
  Operation,
  Pagination,
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
  Direction,
  AccountTransaction,
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
    listOperations: (
      address: string,
      pagination: Pagination,
    ): Promise<[Operation<MemoNotSupported>[], string]> =>
      listOperations(currency, address, pagination),
    getBlock: (height: number): Promise<Block> => getBlock(currency, height),
    getBlockInfo: (height: number): Promise<BlockInfo> => getBlockInfo(currency, height),
    getTransactions(
      _address: string,
      _direction?: Direction,
      _minHeight?: number,
      _maxHeight?: number,
      _cursor?: Cursor,
    ): Promise<Page<AccountTransaction<MemoNotSupported>>> {
      throw new Error("getTransactions is not supported");
    },
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
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(currency, intent, customFees),
    getTokenFromAsset: (asset: AssetInfo): Promise<TokenCurrency | undefined> =>
      getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string): AssetInfo =>
      getAssetFromToken(currency, token, owner),
    computeIntentType,
    refreshOperations: (operations: LiveOperation[]): Promise<LiveOperation[]> =>
      refreshOperations(currency, operations),
  };
}
