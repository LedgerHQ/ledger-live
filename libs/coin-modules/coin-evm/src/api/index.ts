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
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig, Operation as LiveOperation } from "@ledgerhq/types-live";
import { setCoinConfig, type EvmConfig } from "../config";
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

export function createApi(
  config: EvmConfig,
  currencyId: string,
): Api<MemoNotSupported, BufferTxData> {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));
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
