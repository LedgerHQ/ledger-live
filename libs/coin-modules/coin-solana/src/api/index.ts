import type {
  AlpacaApi,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import type { BroadcastConfig } from "@ledgerhq/types-live";
import coinConfig, { type SolanaConfig } from "../config";
import { broadcast, combine } from "../logic";
import { getChainAPI, type Config } from "../network";

export function createApi(config: SolanaConfig & { endpoint: string }): AlpacaApi {
  coinConfig.setCoinConfig(() => ({
    ...config,
    status: { type: "active" as const },
  }));

  const chainApiConfig: Config = { endpoint: config.endpoint };
  const api = getChainAPI(chainApiConfig);

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => broadcast(api, tx),
    combine,
    craftTransaction: (_intent: TransactionIntent, _customFees?: FeeEstimation) => {
      throw new Error("craftTransaction is not supported");
    },
    craftRawTransaction: (
      _tx: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ) => {
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
      throw new Error("lastBlock is not supported");
    },
    listOperations: (_address: string, _opts: ListOperationsOptions) => {
      throw new Error("listOperations is not supported");
    },
    getStakes: (_address: string, _cursor?: Cursor) => {
      throw new Error("getStakes is not supported");
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
  };
}
