// @flow

import { getEnv } from "../../env";

type RemotePlatformAppProvider = {
  value: string,
  url: string,
  label: string,
};

export const providers: RemotePlatformAppProvider[] = [
  {
    value: "production",
    url: getEnv("PLATFORM_MANIFEST_API_URL"),
    label: "Production",
  },
  {
    value: "staging",
    url: getEnv("PLATFORM_MANIFEST_STAGING_API_URL"),
    label: "Staging",
  },
];

export function getProvider(value: string): RemotePlatformAppProvider {
  const provider = providers.find((provider) => provider.value === value);

  if (!provider) {
    throw new Error(`remote platform app provider "${value}" not found`);
  }
  return provider;
}
