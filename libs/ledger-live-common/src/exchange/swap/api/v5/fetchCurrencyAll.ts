import network from "@ledgerhq/live-network/network";
import { isIntegrationTestEnv } from "../../utils/isIntegrationTestEnv";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { fetchCurrencyAllMock } from "./__mocks__/fetchCurrencyAll.mocks";
import { ResponseData as ResponseDataTo } from "./fetchCurrencyTo";
import { ResponseData as ResponseDataFrom } from "./fetchCurrencyFrom";
import { flattenV5CurrenciesAll } from "../../utils/flattenV5CurrenciesAll";
import { getSwapAPIBaseURL } from "../..";

type Props = {
  providers: Array<string>;
  additionalCoinsFlag?: boolean;
};

export type ResponseDataAll = {
  from: ResponseDataFrom["currencyGroups"];
  to: ResponseDataTo["currencyGroups"];
};

export async function fetchCurrencyAll({ providers, additionalCoinsFlag = false }: Props) {
  if (isIntegrationTestEnv()) return Promise.resolve(flattenV5CurrenciesAll(fetchCurrencyAllMock));

  const url = new URL(`${getSwapAPIBaseURL()}/currencies/all`);
  url.searchParams.append("providers-whitelist", providers.join(","));
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());

  try {
    const { data } = await network<ResponseDataAll>({
      method: "GET",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
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
