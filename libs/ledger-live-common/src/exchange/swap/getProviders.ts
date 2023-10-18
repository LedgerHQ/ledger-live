import network from "@ledgerhq/live-network/network";
import qs from "qs";
import { SwapNoAvailableProviders } from "../../errors";
import { getAvailableProviders, getSwapAPIBaseURL } from "./";
import { mockGetProviders } from "./mock";
import type { GetProviders, ProvidersResponseV4 } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";

const getProviders: GetProviders = async () => {
  if (isIntegrationTestEnv()) return mockGetProviders();

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/providers`,
    params: { whitelist: getAvailableProviders() },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: "comma" }),
  });

  const responseV4 = res.data as ProvidersResponseV4;
  if (!responseV4.providers || !Object.keys(responseV4.providers).length) {
    throw new SwapNoAvailableProviders();
  }
  return Object.entries(responseV4.providers).flatMap(([provider, groups]) => ({
    provider: provider,
    pairs: groups.flatMap(group =>
      group.methods.flatMap(tradeMethod =>
        Object.entries(group.pairs).flatMap(([from, toArray]) =>
          (toArray as number[]).map(to => ({
            from: responseV4.currencies[from],
            to: responseV4.currencies[to.toString()],
            tradeMethod,
          })),
        ),
      ),
    ),
  }));
};

export default getProviders;
