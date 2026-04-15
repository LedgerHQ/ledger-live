import type { MinaCoinConfig } from "./config";
import { getCoinConfig, resetCoinConfigForTesting, setCoinConfig } from "./config";

const minaTestConfig = {
  status: { type: "active" as const },
  infra: {
    API_VALIDATORS_BASE_URL: "https://validators.test",
    API_MINA_ROSETTA_NODE: "https://rosetta.test",
    API_MINA_GRAPHQL_NODE: "https://graphql.test",
  },
} satisfies ReturnType<MinaCoinConfig>;

describe("config", () => {
  afterEach(() => {
    resetCoinConfigForTesting();
  });

  it("should throw when config is not set", () => {
    expect(() => getCoinConfig()).toThrow("Mina module config not set");
  });

  it("should return config after it is set", () => {
    setCoinConfig(() => minaTestConfig);

    const result = getCoinConfig();

    expect(result.infra.API_VALIDATORS_BASE_URL).toBe("https://validators.test");
    expect(result.infra.API_MINA_ROSETTA_NODE).toBe("https://rosetta.test");
    expect(result.infra.API_MINA_GRAPHQL_NODE).toBe("https://graphql.test");
  });

  it("should throw when coinConfig returns falsy", () => {
    // @ts-expect-error — covers runtime guard when factory returns undefined
    setCoinConfig(() => undefined);
    expect(() => getCoinConfig()).toThrow("Mina module config not set");
  });
});
