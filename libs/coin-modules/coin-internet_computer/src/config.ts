import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { ICP_NETWORK_URL } from "./consts";

export type IcpCurrencyConfig = CurrencyConfig & { node?: { url: string } };

/** The {@link Context} threaded through the coin-internet_computer API layer (ADR-019). */
export type IcpContext = Context<IcpCurrencyConfig>;

/**
 * The node to reach: `node.url` from the config, or mainnet when the config or field is absent.
 * Trailing slashes are dropped, because broadcasts append `/api/...` to it as a string.
 */
export const nodeUrl = (config?: IcpCurrencyConfig): string => {
  let url = config?.node?.url ?? ICP_NETWORK_URL;
  while (url.endsWith("/")) url = url.slice(0, -1);
  return url;
};
