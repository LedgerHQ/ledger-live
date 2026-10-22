import { defineConfigSchema } from "@shared/app-config";

export const appConfigSchema = defineConfigSchema(z => {
  // `z.httpUrl()` would reject the `localhost` backends of local and mocked runs.
  const url = z.url({ protocol: /^https?$/ });
  return {
    switches: {
      ledgerKeyRing: {
        trustchainApiBaseUrl: url,
        cloudSyncApiBaseUrl: url,
        keycloakBaseUrl: url,
      },
    },
    fixed: {
      keycloakClientId: z.string().min(1),
      keycloakRealm: z.string().min(1),
    },
  };
});
