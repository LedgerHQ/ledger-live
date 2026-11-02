import { type AppConfigStorage, resolveAppConfig } from "@shared/app-config";
import { appConfigSchema } from "./schema";

/**
 * The default option of the build. The `.env` file of each variant sets the profile: staging for
 * adhoc and nightly builds. Dev builds read the developer's own `.env`, so they fall back to
 * staging. Any other value, or none, is prod.
 */
export const profileOf = (
  configProfile: string | undefined,
  isDev: boolean,
): "prod" | "staging" => {
  if (configProfile === undefined) return isDev ? "staging" : "prod";
  return configProfile === "staging" ? "staging" : "prod";
};

/** Resolves the configuration from what `storage` holds. Unselected switches take `profile`. */
export const loadAppConfig = (storage: AppConfigStorage, profile: "prod" | "staging") =>
  resolveAppConfig({
    schema: appConfigSchema,
    storage,
    default: profile,
    switches: {
      // WARNING: only Keycloak reads this switch so far. Ledger Sync still picks its backend from its
      // feature-flag parameter, so the two can disagree until LIVE-39065.
      ledgerKeyRing: {
        label: "Ledger Key Ring backends",
        options: {
          prod: {
            trustchainApiBaseUrl: "https://trustchain.api.live.ledger.com",
            cloudSyncApiBaseUrl: "https://cloud-sync.api.live.ledger.com",
            keycloakBaseUrl: "https://global.api.prd.ledger.com/keycloak",
          },
          staging: {
            trustchainApiBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
            cloudSyncApiBaseUrl: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
            keycloakBaseUrl: "https://global.api.stg.ledger-test.com/keycloak",
          },
        },
      },
    },
    fixed: {
      keycloakClientId: "ledger-keycloak",
      keycloakRealm: "ledger-bc-customers",
    },
  });
