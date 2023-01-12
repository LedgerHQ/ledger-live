import network from "../../../../network";
import { getEnv } from "../../../../env";
import type { RampCatalog } from "../types";
import mockData from "./mock.json";

type RemoteRampProvider = {
  value: string;
  url: string;
  label: string;
};

export const providers: RemoteRampProvider[] = [
  {
    value: "production",
    url: getEnv("PLATFORM_RAMP_CATALOG_API_URL"),
    label: "Production",
  },
  {
    value: "staging",
    url: getEnv("PLATFORM_RAMP_CATALOG_STAGING_API_URL"),
    label: "Staging",
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
  fetchRampCatalog: async (provider: string): Promise<RampCatalog> => {
    if (getEnv("MOCK")) {
      return mockData as RampCatalog;
    }

    const { data } = await network({
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
      url: getProviderURL(provider),
    });
    return data as RampCatalog;
  },
};
export default api;
