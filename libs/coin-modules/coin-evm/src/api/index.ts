import {
  Balance,
  Block,
  BlockInfo,
  FeeEstimation,
  MemoNotSupported,
  Operation,
  Pagination,
  TransactionIntent,
  type AlpacaApi,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
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
} from "../logic/index";

export function createApi(config: EvmConfig, currencyId: CryptoCurrencyId): AlpacaApi {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    combine,
    craftTransaction: (
      transactionIntent: TransactionIntent<MemoNotSupported>,
      customFees?: FeeEstimation,
    ): Promise<string> => craftTransaction(currency, { transactionIntent, customFees }),
    estimateFees: (
      transactionIntent: TransactionIntent<MemoNotSupported>,
    ): Promise<FeeEstimation> => estimate(currency, transactionIntent),
    getBalance: (address: string): Promise<Balance[]> => getBalance(currency, address),
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      address: string,
      pagination: Pagination,
    ): Promise<[Operation<MemoNotSupported>[], string]> =>
      listOperations(currency, address, pagination),
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
  };
}

async function estimate(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<FeeEstimation> {
  const fees = await estimateFees(currency, transactionIntent);
  return { value: fees };
}
