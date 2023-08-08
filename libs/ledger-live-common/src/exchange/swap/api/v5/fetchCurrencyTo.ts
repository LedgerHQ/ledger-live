import network from "@ledgerhq/live-network/network";
import { getEnv } from "../../../../env";
import { fetchCurrencyToMock } from "./__mocks__/fetchCurrencyTo.mocks";

type Props = {
  currencyFrom: string;
  additionalCoinsFlag?: boolean;
};

export type ResponseData = {
  currencyGroups: CurrencyGroup[];
};
type CurrencyGroup = {
  network: string;
  supportedCurrencies: string[];
};

export async function fetchCurrencyTo({ currencyFrom, additionalCoinsFlag = false }: Props) {
  if (getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN")) return Promise.resolve(fetchCurrencyToMock);

  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/currencies/to`);

  url.searchParams.append("currencyFrom", currencyFrom);
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());

  try {
    const { data } = await network<ResponseData>({
      method: "GET",
      url: url.toString(),
      timeout: 10000,
    });
    return data;
  } catch (e) {
    throw Error(`Something went wrong in fetchCurrencyTo call`);
  }
}
