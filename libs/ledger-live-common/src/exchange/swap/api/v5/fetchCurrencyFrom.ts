import network from "@ledgerhq/live-network/network";
import { isIntegrationTestEnv } from "../../utils/isIntegrationTestEnv";
import { getEnv } from "../../../../env";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";

type Props = {
  providers: Array<string>;
  currencyTo?: string;
  additionalCoinsFlag?: boolean;
};

export type ResponseData = {
  currencyGroups: Array<{
    network: string;
    supportedCurrencies: Array<string>;
  }>;
};

export async function fetchCurrencyFrom({
  providers,
  currencyTo,
  additionalCoinsFlag = false,
}: Props) {
  if (isIntegrationTestEnv()) return Promise.resolve(fetchCurrencyFrom);

  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/currencies/from`);
  url.searchParams.append("providers-whitelist", providers.join(","));
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());
  if (currencyTo) {
    url.searchParams.append("currencyTo", currencyTo);
  }

  try {
    const { data } = await network<ResponseData>({
      method: "GET",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
    });
    return data;
  } catch (e) {
    throw Error("Something went wrong in fetchCurrencyFrom call");
  }
}
