import { setCoinConfig, getCoinConfig } from "./config";

describe("config", () => {
  afterEach(() => {
    // Reset to undefined by setting a config that returns undefined-like
    // We need to use setCoinConfig to clear state between tests
  });

  it("should throw when config is not set", () => {
    // Create a fresh module to test unset state
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getCoinConfig: freshGetCoinConfig } = require("./config");
    expect(() => freshGetCoinConfig()).toThrow("Mina module config not set");
  });

  it("should return config after it is set", () => {
    const mockConfig = {
      infra: {
        API_VALIDATORS_BASE_URL: "https://validators.test",
        API_MINA_ROSETTA_NODE: "https://rosetta.test",
        API_MINA_GRAPHQL_NODE: "https://graphql.test",
      },
    };
    setCoinConfig(() => mockConfig as any);

    const result = getCoinConfig();

    expect(result.infra.API_VALIDATORS_BASE_URL).toBe("https://validators.test");
    expect(result.infra.API_MINA_ROSETTA_NODE).toBe("https://rosetta.test");
    expect(result.infra.API_MINA_GRAPHQL_NODE).toBe("https://graphql.test");
  });

  it("should throw when coinConfig returns falsy", () => {
    setCoinConfig((() => undefined) as any);
    expect(() => getCoinConfig()).toThrow("Mina module config not set");
  });
});
