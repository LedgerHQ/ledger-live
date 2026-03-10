import type {
  AlpacaApi,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import type { BroadcastConfig } from "@ledgerhq/types-live";
import coinConfig, { type SolanaConfig } from "../config";
import { broadcast, combine, craftTransaction, estimateFees, getBalance, lastBlock } from "../logic";
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
    craftTransaction: (intent: TransactionIntent, customFees?: FeeEstimation) =>
      craftTransaction(api, intent, customFees),
    craftRawTransaction: (
      _tx: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ) => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (intent: TransactionIntent, customFeesParameters?: FeeEstimation["parameters"]) =>
      estimateFees(api, intent, customFeesParameters),
    getBalance: (address: string) => getBalance(api, address),
    lastBlock: () => lastBlock(api),
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
