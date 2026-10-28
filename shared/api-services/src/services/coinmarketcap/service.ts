import type { ApiServiceDescriptor } from "../../compose";
import { coinMarketCapApi, coinMarketCapApiExtra, type CoinMarketCapApi } from "./api";
import type { CoinMarketCapApiExtra } from "./types";

export function coinMarketCapService(
  own: () => CoinMarketCapApiExtra,
): ApiServiceDescriptor<CoinMarketCapApi> {
  return { api: coinMarketCapApi, buildExtra: () => coinMarketCapApiExtra(own()) };
}
