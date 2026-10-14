import type { BoilerplateCoinConfig, BoilerplateContext } from "./config";

export const createBoilerplateCoinConfig = (
  overrides: Partial<BoilerplateCoinConfig> = {},
): BoilerplateCoinConfig => ({
  status: { type: "active" },
  name: "Boilerplate",
  unit: { name: "BOL", code: "BOL", magnitude: 8 },
  node: { url: "https://node.example" },
  indexer: { url: "https://indexer.example" },
  ...overrides,
});

export const createBoilerplateContext = (
  overrides: Partial<BoilerplateCoinConfig> = {},
): BoilerplateContext => ({
  config: async () => createBoilerplateCoinConfig(overrides),
  logger: () => {},
});
