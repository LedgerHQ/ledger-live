import {
  Balance,
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
import { broadcast, combine, lastBlock } from "../logic/";
import { EvmAsset } from "../types";
import { listOperations } from "../logic/listOperations";
import { estimateFees, craftTransaction } from "../logic/";

export function createApi(config: EvmConfig, currencyId: CryptoCurrencyId): AlpacaApi<EvmAsset> {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    combine,
    craftTransaction: (
      transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
    ): Promise<string> => craftTransaction(currency, { transactionIntent }),
    estimateFees: (
      transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
    ): Promise<FeeEstimation> => estimate(currency, transactionIntent),
    getBalance: (_address: string): Promise<Balance<EvmAsset>[]> => {
      throw new Error("UnsupportedMethod");
    },
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      address: string,
      pagination: Pagination,
    ): Promise<[Operation<EvmAsset, MemoNotSupported>[], string]> =>
      listOperations(currency, address, pagination),
  };
}

async function estimate(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
): Promise<FeeEstimation> {
  const fees = await estimateFees(currency, transactionIntent);
  return { value: fees };
}
