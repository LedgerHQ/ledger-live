import { readOnlyConfigStorage, type AppConfigStorage } from "@shared/app-config";
import { loadAppConfig, profileOf } from "./load";

const noSelections = storageOf({}, {});

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
    expect(loadAppConfig(noSelections, profile).config).toMatchObject({
      keycloakBaseUrl,
      keycloakClientId: "ledger-keycloak",
      keycloakRealm: "ledger-bc-customers",
    });
  });

  it("resolves the dev values of a staging profile on Dev", () => {
    const storage = storageOf(
      { ledgerKeyRing: "dev", keycloakRealm: "dev" },
      { keycloakBaseUrl: "http://localhost:8080", keycloakRealm: "dev-realm" },
    );

    expect(loadAppConfig(storage, "staging").config).toMatchObject({
      keycloakBaseUrl: "http://localhost:8080",
      trustchainApiBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
      keycloakRealm: "dev-realm",
    });
    expect(loadAppConfig(storage, "prod").config).toMatchObject({
      keycloakBaseUrl: "https://global.api.prd.ledger.com/keycloak",
      keycloakRealm: "ledger-bc-customers",
    });
  });
});

function storageOf(selections: unknown, devValues: unknown): AppConfigStorage {
  return {
    selections: readOnlyConfigStorage(() => selections),
    devValues: readOnlyConfigStorage(() => devValues),
  };
}
