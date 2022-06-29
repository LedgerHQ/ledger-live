import qs from "qs";
import { getEnv } from "../../env";
import { SwapNoAvailableProviders } from "../../errors";
import network from "../../network";
import { getAvailableProviders, getSwapAPIBaseURL } from "./";
import { mockGetProviders } from "./mock";
import type { GetProviders } from "./types";

const getProviders: GetProviders = async () => {
  if (getEnv("MOCK")) return mockGetProviders();

  // Rely on the api base to determine the version logic
  const usesV3 = getSwapAPIBaseURL().endsWith("v3");

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/providers`,
    params: usesV3 ? { whitelist: getAvailableProviders() } : undefined,
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "comma" }),
  });

  if (!res.data.length) {
    throw new SwapNoAvailableProviders();
  }

  return res.data;
};

export default getProviders;
