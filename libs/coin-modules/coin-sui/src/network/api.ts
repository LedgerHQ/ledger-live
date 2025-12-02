import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";
import coinConfig from "../config";
import { getEnv } from "@ledgerhq/live-env";

const apiMap: Record<string, SuiClient> = {};
type AsyncApiFunction<T> = (api: SuiClient) => Promise<T>;

type GenericInput<T> = T extends (...args: infer K) => unknown ? K : never;
type Inputs = GenericInput<typeof fetch>;

const fetcher = (url: Inputs[0], options: Inputs[1], retry = 3): Promise<Response> => {
  const version = getEnv("LEDGER_CLIENT_VERSION") || "";
  const isCI = version.includes("ll-ci") || version === "";
  if (options) {
    options.headers = {
      ...options.headers,
      "X-Ledger-Client-Version": isCI ? "lld/2.124.0-dev" : version, // for integration cli tests
    };
  }
  if (retry === 1) return fetch(url, options);

  return fetch(url, options).catch(() => fetcher(url, options, retry - 1));
};

/**
 * Connects to Sui Api
 */
export async function withApi<T>(execute: AsyncApiFunction<T>) {
  const url = coinConfig.getCoinConfig().node.url;
  const transport = new SuiHTTPTransport({ url, fetch: fetcher });

  apiMap[url] ??= new SuiClient({ transport });

  return await execute(apiMap[url]);
}
