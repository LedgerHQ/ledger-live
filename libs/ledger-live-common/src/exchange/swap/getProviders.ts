import qs from "qs";
import { getEnv } from "../../env";
import { SwapNoAvailableProviders } from "../../errors";
import network from "../../network";
import { getAvailableProviders, getSwapAPIBaseURL } from "./";
import { mockGetProviders } from "./mock";
import type { GetProviders, ProvidersResponseV4 } from "./types";

const getProviders: GetProviders = async () => {
  if (getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN")) return mockGetProviders();

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/providers`,
    params: { whitelist: getAvailableProviders() },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "comma" }),
  });

  const responseV4 = res.data as ProvidersResponseV4;
  if (!responseV4.providers || !Object.keys(responseV4.providers).length) {
    throw new SwapNoAvailableProviders();
  }
  return Object.entries(responseV4.providers).flatMap(([provider, groups]) => ({
    provider: provider,
    pairs: groups.flatMap((group) =>
      group.methods.flatMap((tradeMethod) =>
        Object.entries(group.pairs).flatMap(([from, toArray]) =>
          (toArray as number[]).map((to) => ({
            from: responseV4.currencies[from],
            to: responseV4.currencies[to.toString()],
            tradeMethod,
          }))
        )
      )
    ),
  }));
};

export default getProviders;
