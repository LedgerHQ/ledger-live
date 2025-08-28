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
  Stake,
  Reward,
  TransactionValidation,
  AssetInfo,
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";
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
  getStakes,
} from "../logic/index";

export function createApi(config: EvmConfig, currencyId: string): Api {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    combine,
    craftTransaction: (
      transactionIntent: TransactionIntent<MemoNotSupported>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(currency, { transactionIntent, customFees }),
    estimateFees: (
      transactionIntent: TransactionIntent<MemoNotSupported>,
    ): Promise<FeeEstimation> => estimateFees(currency, transactionIntent),
    getBalance: (address: string): Promise<Balance[]> => getBalance(currency, address),
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      address: string,
      pagination: Pagination,
    ): Promise<[Operation<MemoNotSupported>[], string]> =>
      listOperations(currency, address, pagination.minHeight),
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes: (address: string, cursor?: Cursor): Promise<Page<Stake>> =>
      getStakes(currency, address, cursor),
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getSequence: (address: string): Promise<number> => getSequence(currency, address),
    validateIntent: (intent: TransactionIntent): Promise<TransactionValidation> =>
      validateIntent(currency, intent),
    getTokenFromAsset: (asset: AssetInfo): TokenCurrency | undefined =>
      getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string): AssetInfo =>
      getAssetFromToken(currency, token, owner),
  };
}
