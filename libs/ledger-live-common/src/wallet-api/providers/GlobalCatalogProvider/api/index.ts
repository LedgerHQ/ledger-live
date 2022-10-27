import network from "../../../../network";
import { getEnv } from "../../../../env";
import type { GlobalCatalog } from "../types";
import mockData from "./mock.json";

export const providers = [
  {
    value: "production",
    url: getEnv("PLATFORM_GLOBAL_CATALOG_API_URL"),
  },
  {
    value: "staging",
    url: getEnv("PLATFORM_GLOBAL_CATALOG_STAGING_API_URL"),
  },
];

export function getProviderURL(value: string): string {
  const provider = providers.find((provider) => provider.value === value);

  if (!provider) {
    throw new Error(`remote ramp catalog provider "${value}" not found`);
  }
  return provider.url;
}

const api = {
  fetchGlobalCatalog: async (provider: string): Promise<GlobalCatalog> => {
    if (getEnv("MOCK")) {
      return mockData as GlobalCatalog;
    }

    const { data } = await network({
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
      url: getProviderURL(provider),
    });
    return data as GlobalCatalog;
  },
};
export default api;
