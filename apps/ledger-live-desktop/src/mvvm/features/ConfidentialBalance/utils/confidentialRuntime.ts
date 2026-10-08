import { ConfidentialError, type ConfidentialClient } from "@ledgerhq/coin-evm/confidential";
import type { EvmConfigInfo, EvmContext } from "@ledgerhq/coin-evm/config";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";

const DEFAULT_SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export type ConfidentialClientOptions = { rpcUrl: string; relayerUrl: string; oracleUrl: string };
export type CreateConfidentialClient = (options: ConfidentialClientOptions) => ConfidentialClient;

export const isRealConfidentialApi = (): boolean => process.env.CONFIDENTIAL_API === "real";

export const getSepoliaRpcUrl = (): string =>
  process.env.CONFIDENTIAL_SEPOLIA_RPC_URL ?? DEFAULT_SEPOLIA_RPC_URL;

let client: ConfidentialClient | undefined;

function getConfidentialClient(createClient: CreateConfidentialClient): ConfidentialClient {
  if (client) return client;
  const oracleUrl = process.env.CONFIDENTIAL_TX_SERVICE_URL;
  if (!oracleUrl) {
    throw new ConfidentialError("Unavailable", "CONFIDENTIAL_TX_SERVICE_URL is not set");
  }
  client = createClient({
    rpcUrl: getSepoliaRpcUrl(),
    relayerUrl: `${oracleUrl}/relayer`,
    oracleUrl,
  });
  return client;
}

export function createConfidentialContext(
  currencyId: string,
  createClient: CreateConfidentialClient,
): EvmContext {
  const context = buildContext<EvmConfigInfo>(currencyId);
  return isRealConfidentialApi()
    ? { ...context, confidential: getConfidentialClient(createClient) }
    : context;
}

export function resetConfidentialClient(): void {
  client = undefined;
}
