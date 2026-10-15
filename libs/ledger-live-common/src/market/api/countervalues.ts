import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import { MarketItemResponse, MarketCurrencyRequestParams } from "../utils/types";
import URL from "url";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

export async function fetchCurrency({
  counterCurrency,
  id,
  ledgerIds,
}: MarketCurrencyRequestParams): Promise<MarketItemResponse> {
  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      to: counterCurrency,
      pageSize: 1,
      limit: 1,
      ...(ledgerIds?.length
        ? { ledgerIds: ledgerIds.join(",") }
        : {
            ids: id,
          }),
    },
  });

  const { data } = await network<MarketItemResponse[]>({ method: "GET", url });

  return data[0];
}
