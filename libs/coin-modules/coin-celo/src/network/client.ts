import { createPublicClient, http, type PublicClient } from "viem";
import { celo } from "viem/chains";
import type { CeloConfigInfo } from "../config";

let cached: { nodeUrl: string; client: PublicClient } | null = null;

const getNodeUrl = (config: CeloConfigInfo): string => {
  const { node } = config;
  if (node.type !== "external") {
    throw new Error("Celo coin config must set an external node");
  }
  return node.uri;
};

/**
 * Returns a lazy viem PublicClient for the Celo network, on the node the coin config names.
 * It is rebuilt when that node changes, so a remote config update applies without a restart.
 */
export const getCeloClient = (config: CeloConfigInfo): PublicClient => {
  const nodeUrl = getNodeUrl(config);
  if (cached?.nodeUrl !== nodeUrl) {
    cached = {
      nodeUrl,
      client: createPublicClient({
        chain: celo,
        transport: http(nodeUrl),
      }) as unknown as PublicClient,
    };
  }
  return cached.client;
};

/**
 * Returns the current gas price for the given fee currency (or native CELO).
 * Celo's `eth_gasPrice` RPC accepts an optional fee-currency address param,
 * which viem does not expose natively.
 */
export const celoGasPrice = async (
  config: CeloConfigInfo,
  feeCurrency?: `0x${string}`,
): Promise<bigint> => {
  const c = getCeloClient(config);
  const result = await c.request({
    method: "eth_gasPrice",
    params: feeCurrency ? [feeCurrency] : ([] as unknown as []),
  } as Parameters<typeof c.request>[0]);
  return BigInt(result as string);
};

export type CeloEstimateGasParams = {
  from: `0x${string}`;
  to?: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  feeCurrency?: `0x${string}`;
};

/**
 * Estimates gas via Celo's `eth_estimateGas` RPC. Used instead of viem's
 * `estimateGas` because the latter does not expose the fee-currency param —
 * without it, the node underestimates gas for non-native fee-token transactions.
 */
export const celoEstimateGas = async (
  config: CeloConfigInfo,
  params: CeloEstimateGasParams,
): Promise<bigint> => {
  const c = getCeloClient(config);
  const rpcParams: Record<string, string> = { from: params.from };
  if (params.to !== undefined) rpcParams.to = params.to;
  if (params.data !== undefined) rpcParams.data = params.data;
  if (params.value !== undefined) rpcParams.value = `0x${params.value.toString(16)}`;
  if (params.maxFeePerGas !== undefined) {
    rpcParams.maxFeePerGas = `0x${params.maxFeePerGas.toString(16)}`;
  }
  if (params.maxPriorityFeePerGas !== undefined) {
    rpcParams.maxPriorityFeePerGas = `0x${params.maxPriorityFeePerGas.toString(16)}`;
  }
  if (params.feeCurrency !== undefined) rpcParams.feeCurrency = params.feeCurrency;
  const result = await c.request({
    method: "eth_estimateGas",
    params: [rpcParams],
  } as Parameters<typeof c.request>[0]);
  return BigInt(result as string);
};
