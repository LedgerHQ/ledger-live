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
import { type EvmConfig, setCoinConfig } from "../config";
import { EvmAsset } from "../types";

export function createApi(config: EvmConfig, _currencyId: CryptoCurrencyId): AlpacaApi<EvmAsset> {
  setCoinConfig(() => ({ info: { ...config, status: { type: "active" } } }));

  return {
    broadcast: (_tx: string): Promise<string> => {
      throw new Error("UnsupportedMethod");
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
    lastBlock: (): Promise<BlockInfo> => {
      throw new Error("UnsupportedMethod");
    },
    listOperations: (
      _address: string,
      _pagination: Pagination,
    ): Promise<[Operation<EvmAsset, MemoNotSupported>[], string]> => {
      throw new Error("UnsupportedMethod");
    },
  };
}
