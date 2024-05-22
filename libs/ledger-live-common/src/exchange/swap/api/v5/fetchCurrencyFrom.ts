import network from "@ledgerhq/live-network/network";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import { flattenV5CurrenciesToAndFrom } from "../../utils/flattenV5CurrenciesToAndFrom";
import { fetchCurrencyFromMock } from "./__mocks__/fetchCurrencyFrom.mocks";
import { getAvailableProviders, getSwapAPIBaseURL } from "../..";
import { getEnv } from "@ledgerhq/live-env";

type Props = {
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
};

export type ResponseData = {
  currencyGroups: Array<{
    network: string;
    supportedCurrencies: Array<string>;
  }>;
};

export async function fetchCurrencyFrom({ currencyTo, additionalCoinsFlag = false }: Props) {
  if (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN"))
    return flattenV5CurrenciesToAndFrom(fetchCurrencyFromMock);

  const url = new URL(`${getSwapAPIBaseURL()}/currencies/from`);
  const providers = getAvailableProviders();
  url.searchParams.append("providers-whitelist", providers.join(","));
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());

  if (currencyTo) {
    url.searchParams.append("currency-to", currencyTo);
  }

  try {
    const { data } = await network<ResponseData>({
      method: "GET",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
    });
    return flattenV5CurrenciesToAndFrom(data);
  } catch (e) {
    throw Error("Something went wrong in fetchCurrencyFrom call");
  }
}
