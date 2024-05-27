import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { fetchCurrencyAllMock } from "./__mocks__/fetchCurrencyAll.mocks";
import { ResponseData as ResponseDataTo } from "./fetchCurrencyTo";
import { ResponseData as ResponseDataFrom } from "./fetchCurrencyFrom";
import { flattenV5CurrenciesAll } from "../../utils/flattenV5CurrenciesAll";
import { getSwapAPIBaseURL, getSwapUserIP, getAvailableProviders } from "../..";
import { getEnv } from "@ledgerhq/live-env";

type Props = {
  additionalCoinsFlag?: boolean;
};

export type ResponseDataAll = {
  from: ResponseDataFrom["currencyGroups"];
  to: ResponseDataTo["currencyGroups"];
};

export async function fetchCurrencyAll({ additionalCoinsFlag = false }: Props) {
  if (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN"))
    return Promise.resolve(flattenV5CurrenciesAll(fetchCurrencyAllMock));

  const providers = getAvailableProviders();
  const url = new URL(`${getSwapAPIBaseURL()}/currencies/all`);
  url.searchParams.append("providers-whitelist", providers.join(","));
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());
  const headers = getSwapUserIP();

  try {
    const { data } = await network<ResponseDataAll>({
      method: "GET",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
      ...(headers !== undefined ? { headers } : {}),
    });
    return flattenV5CurrenciesAll(data);
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.code === "ECONNABORTED") {
        // TODO: LIVE-8901 (handle request timeout)
      }
    }
    if (e instanceof LedgerAPI4xx) {
      // TODO: LIVE-8901 (handle 4xx)
    }
    throw e;
  }
}
