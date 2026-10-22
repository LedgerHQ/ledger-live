import type { ConfigStorage } from "@shared/app-config";
import { loadAppConfig, profileOf } from "./load";

const noSelections: ConfigStorage = { getAll: () => ({}), set() {}, clear() {} };

describe("profileOf", () => {
  it.each([
    { configProfile: "staging", profile: "staging" },
    { configProfile: "prod", profile: "prod" },
    { configProfile: "unknown", profile: "prod" },
    { configProfile: undefined, profile: "prod" },
  ] as const)("is $profile for the $configProfile profile", ({ configProfile, profile }) => {
    expect(profileOf(configProfile)).toBe(profile);
  });
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
