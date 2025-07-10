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
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";
import { setCoinConfig, type EvmConfig } from "../config";
import { broadcast, combine, lastBlock } from "../logic/";
import { EvmAsset } from "../types";
import { craftTransaction } from "../logic/craftTransaction";

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
      _transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
    ): Promise<FeeEstimation> => {
      throw new Error("UnsupportedMethod");
    },
    getBalance: (_address: string): Promise<Balance<EvmAsset>[]> => {
      throw new Error("UnsupportedMethod");
    },
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      _address: string,
      _pagination: Pagination,
    ): Promise<[Operation<EvmAsset, MemoNotSupported>[], string]> => {
      throw new Error("UnsupportedMethod");
    },
  };
}
