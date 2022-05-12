import type { GetProviders } from "./types";
import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import { getEnv } from "../../env";
import { mockGetProviders } from "./mock";
import { SwapNoAvailableProviders } from "../../errors";

const getProviders: GetProviders = async () => {
  if (getEnv("MOCK")) return mockGetProviders();
  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/providers`,
  });

  if (!res.data.length) {
    throw new SwapNoAvailableProviders();
  }

  return res.data;
};

export default getProviders;
