import { getEnv } from "@ledgerhq/live-env";
import { createPublicClient, http, type PublicClient } from "viem";
import { celo } from "viem/chains";

let client: PublicClient | null = null;

/**
 * Returns a lazy singleton viem PublicClient for the Celo network.
 * The transport URL is sourced from the `API_CELO_NODE` env variable.
 */
export const getCeloClient = (): PublicClient => {
  if (!client) {
    client = createPublicClient({
      chain: celo,
      transport: http(getEnv("API_CELO_NODE")),
    }) as unknown as PublicClient;
  }
  return client;
};

/**
 * Returns the current gas price for the given fee currency (or native CELO).
 * Celo's `eth_gasPrice` RPC accepts an optional fee-currency address param,
 * which viem does not expose natively.
 */
export const celoGasPrice = async (feeCurrency?: `0x${string}`): Promise<bigint> => {
  const c = getCeloClient();
  const result = await c.request({
    method: "eth_gasPrice",
    params: feeCurrency ? [feeCurrency] : ([] as unknown as []),
  } as Parameters<typeof c.request>[0]);
  return BigInt(result as string);
};
