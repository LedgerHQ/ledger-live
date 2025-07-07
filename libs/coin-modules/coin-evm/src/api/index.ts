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
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { BroadcastConfig } from "@ledgerhq/types-live";
import { type EvmConfig, setCoinConfig } from "../config";
import { EvmAsset } from "../types";
import { lastBlock } from "../logic/lastBlock";
import broadcastLogic from "../logic/broadcast";

export function createApi(config: EvmConfig, currencyId: CryptoCurrencyId): AlpacaApi<EvmAsset> {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));
  const currency = getCryptoCurrencyById(currencyId);

  return {
    async broadcast(tx: string, broadcastConfig?: BroadcastConfig): Promise<string> {
      return await broadcastLogic({ currency: currency, signature: tx, broadcastConfig });
    },
    combine: (_tx: string, _signature: string, _pubkey?: string): string | Promise<string> => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: (
      _transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
      _customFees?: bigint,
    ): Promise<string> => {
      throw new Error("UnsupportedMethod");
    },
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