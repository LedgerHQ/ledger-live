import network from "../../../../network";
import { getEnv } from "../../../../env";
import type { LiveAppManifest } from "../../types";
import mockData from "./mock.json";

type RemotePlatformAppProvider = {
  value: string;
  url: string;
  label: string;
};

export const providers = [
  {
    value: "production",
    url: getEnv("PLATFORM_MANIFEST_API_URL"),
  },
  {
    value: "staging",
    url: getEnv("PLATFORM_MANIFEST_STAGING_API_URL"),
  },
];

export function getProviderURL(
  value: string
): RemotePlatformAppProvider["url"] {
  const provider = providers.find((provider) => provider.value === value);

  if (!provider) {
    throw new Error(`remote live app provider "${value}" not found`);
  }
  return provider.url;
}

const api = {
  fetchLiveAppManifests: async (
    provider: string
  ): Promise<LiveAppManifest[]> => {
    if (getEnv("MOCK")) {
      if (getEnv("MOCK_REMOTE_LIVE_MANIFEST")) {
        return [
          ...mockData,
          ...JSON.parse(getEnv("MOCK_REMOTE_LIVE_MANIFEST")),
        ] as LiveAppManifest[];
      }
      return mockData as LiveAppManifest[];
    }

    const { data } = await network({
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
      url: getProviderURL(provider),
    });
    return data as LiveAppManifest[];
  },
};
export default api;
