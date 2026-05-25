import network from "@ledgerhq/live-network";
import coinConfig, { DEFAULT_HYPERCORE_INFO_URL } from "../config";

export type SpotBalance = {
  coin: string;
  token: number;
  total: string;
  hold: string;
  entryNtl: string;
};

export type SpotClearinghouseState = {
  balances: SpotBalance[];
};

export async function fetchSpotClearinghouseState(
  address: string,
  currencyId?: string,
): Promise<SpotClearinghouseState> {
  const { data } = await network<SpotClearinghouseState, { type: string; user: string }>({
    method: "POST",
    url: getInfoUrl(currencyId),
    data: { type: "spotClearinghouseState", user: address },
  });
  return data;
}

function getInfoUrl(currencyId?: string): string {
  try {
    const url = coinConfig.getCoinConfig(currencyId)?.infoUrl;
    if (url) return url;
  } catch {
    // No coin config registered — fall back to the public Hyperliquid endpoint.
  }
  return DEFAULT_HYPERCORE_INFO_URL;
}
