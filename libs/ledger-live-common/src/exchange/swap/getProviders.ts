import network from "@ledgerhq/live-network/network";
import qs from "qs";
import { SwapNoAvailableProviders } from "../../errors";
import { getAvailableProviders, getSwapAPIBaseURL } from "./";
import { mockGetProviders } from "./mock";
import type { GetProviders, ProvidersResponseV4 } from "./types";
import { isPlaywrightEnv } from "./utils/isPlaywrightEnv";

const getProviders: GetProviders = async () => {
  // if (isPlaywrightEnv()) return mockGetProviders();
  // if (getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN")) return mockGetProviders();

  // if it's a mock run and it's not a playwright or a detox run, return the mock provider
  // otherwise make a real network request

  if (getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN") && !getEnv("DETOX_RUN")) {
    console.log("getProviders - getting mock providers");
    console.log("getProviders - MOCK", getEnv("MOCK"));
    console.log("getProviders - APP Name", getEnv("APP_NAME"));
    console.log("getProviders - PLAYWRIGHT_RUN", getEnv("PLAYWRIGHT_RUN"));
    console.log("getProviders - DETOX_RUN", getEnv("DETOX_RUN"));
    console.log("getProviders - SWAP_MOCK_SERVER_BASE", getEnv("SWAP_MOCK_SERVER_BASE"));
    return mockGetProviders();
  }

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/providers`,
    params: { whitelist: getAvailableProviders() },
    paramsSerializer: params => qs.stringify(params, { arrayFormat: "comma" }),
  });

  console.log("response!: ", { res });

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
