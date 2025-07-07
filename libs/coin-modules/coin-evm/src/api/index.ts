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
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";
import { type CoinConfig, setCoinConfig } from "../config";
import broadcastLogic from "../logic/broadcast";
import { EvmAsset } from "../types";

const coinEvmInstances = new Map<string, CoinEvmApi>();

export class CoinEvmApi implements AlpacaApi<EvmAsset> {
  private currency: CryptoCurrency;

  constructor(currency: CryptoCurrency) {
    this.currency = currency;
  }

  async broadcast(tx: string, broadcastConfig?: BroadcastConfig): Promise<string> {
    return await broadcastLogic({ currency: this.currency, signature: tx, broadcastConfig });
  }

  combine(_tx: string, _signature: string, _pubkey?: string): string | Promise<string> {
    throw new Error("UnsupportedMethod");
  }

  async craftTransaction(
    _transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
    _customFees?: bigint,
  ): Promise<string> {
    throw new Error("UnsupportedMethod");
  }

  async estimateFees(
    _transactionIntent: TransactionIntent<EvmAsset, MemoNotSupported>,
  ): Promise<FeeEstimation> {
    throw new Error("UnsupportedMethod");
  }

  async getBalance(_address: string): Promise<Balance<EvmAsset>[]> {
    throw new Error("UnsupportedMethod");
  }

  async lastBlock(): Promise<BlockInfo> {
    throw new Error("UnsupportedMethod");
  }

  async listOperations(
    _address: string,
    _pagination: Pagination,
  ): Promise<[Operation<EvmAsset, MemoNotSupported>[], string]> {
    throw new Error("UnsupportedMethod");
  }
}

export function createEvmApi(
  config: CoinConfig,
): (currency: CryptoCurrency) => AlpacaApi<EvmAsset> {
  setCoinConfig(config);

  return (currency: CryptoCurrency): AlpacaApi<EvmAsset> => {
    const currencyId = currency.id;

    if (!coinEvmInstances.has(currencyId)) {
      const instance = new CoinEvmApi(currency);
      coinEvmInstances.set(currencyId, instance);
    }

    return coinEvmInstances.get(currencyId)!;
  };
}
