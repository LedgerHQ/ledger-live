import network from "@ledgerhq/live-network/network";
import { isIntegrationTestEnv } from "../../utils/isIntegrationTestEnv";
import { getEnv } from "@ledgerhq/live-env";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../const/timeout";
import axios from "axios";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { fetchCurrencyAllMock } from "./__mocks__/fetchCurrencyAll.mocks";

type Props = {
  providers: Array<string>;
  additionalCoinsFlag?: boolean;
};

export type ResponseData = {
  from: From[];
  to: From[];
};
type From = {
  network: string;
  supportedCurrencies: string[];
};

export async function fetchCurrencyAll({ providers, additionalCoinsFlag = false }: Props) {
  if (isIntegrationTestEnv()) return Promise.resolve(fetchCurrencyAllMock);

  const url = new URL(`${getEnv("SWAP_API_BASE_V5")}/currencies/all`);
  url.searchParams.append("providers-whitelist", providers.join(","));
  url.searchParams.append("additional-coins-flag", additionalCoinsFlag.toString());

  try {
    const { data } = await network<ResponseData>({
      method: "GET",
      url: url.toString(),
      timeout: DEFAULT_SWAP_TIMEOUT_MS,
    });
    return data;
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
