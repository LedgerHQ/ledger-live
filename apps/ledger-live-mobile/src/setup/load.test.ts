import type { ConfigStorage } from "@shared/app-config";
import { loadAppConfig, profileOf } from "./load";

const noSelections: ConfigStorage = { getAll: () => ({}), set() {}, clear() {} };

describe("profileOf", () => {
  it.each([
    { build: "release", configProfile: "staging", isDev: false, profile: "staging" },
    { build: "release", configProfile: "prod", isDev: false, profile: "prod" },
    { build: "release", configProfile: "unknown", isDev: false, profile: "prod" },
    { build: "release", configProfile: undefined, isDev: false, profile: "prod" },
    { build: "dev", configProfile: "prod", isDev: true, profile: "prod" },
    { build: "dev", configProfile: undefined, isDev: true, profile: "staging" },
  ] as const)(
    "is $profile for a $build build with the $configProfile profile",
    ({ configProfile, isDev, profile }) => {
      expect(profileOf(configProfile, isDev)).toBe(profile);
    },
  );
});

describe("loadAppConfig", () => {
  it.each([
    ["prod", "https://global.api.prd.ledger.com/keycloak"],
    ["staging", "https://global.api.stg.ledger-test.com/keycloak"],
  ] as const)("resolves the Keycloak of the %s profile", (profile, keycloakBaseUrl) => {
    expect(loadAppConfig(noSelections, profile)).toMatchObject({
      keycloakBaseUrl,
      keycloakClientId: "ledger-keycloak",
      keycloakRealm: "ledger-bc-customers",
    });
  });
});
