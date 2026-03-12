import {
  AlpacaApi,
  BroadcastConfig,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { SolanaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { lastBlock } from "../logic/lastBlock";
import { getChainAPI } from "../network";
import { endpointByCurrencyId } from "../utils";

export function createApi(config: SolanaCoinConfig, currencyId: string): AlpacaApi {
  coinConfig.setCoinConfig(() => ({
    ...config,
    status: { type: "active" as const },
  }));

  const api = getChainAPI({ endpoint: endpointByCurrencyId(currencyId) });

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => {
      return broadcast(api, tx);
    },
    combine: (tx: string, signature: string, _pubkey?: string) => {
      return combine(tx, signature);
    },
    craftTransaction: (_intent: TransactionIntent, _customFees?: FeeEstimation) => {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (_tx: string, _sender: string, _publicKey: string, _sequence: bigint) => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      _intent: TransactionIntent,
      _customFeesParameters?: FeeEstimation["parameters"],
    ) => {
      throw new Error("estimateFees is not supported");
    },
    getBalance: (_address: string) => {
      throw new Error("getBalance is not supported");
    },
    lastBlock: () => {
      return lastBlock(api);
    },
    getBlock: () => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: () => {
      throw new Error("getBlockInfo is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor) => {
      throw new Error("getRewards is not supported");
    },
    getValidators: () => {
      throw new Error("getValidators is not supported");
    },
    listOperations: (_address: string, _options: ListOperationsOptions) => {
      throw new Error("listOperations is not supported");
    },
    getStakes: (_address: string, _cursor?: Cursor) => {
      throw new Error("getStakes is not supported");
    },
    validateIntent: () => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: () => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: () => {
      throw new Error("validateAddress is not supported");
    },
  };
}
