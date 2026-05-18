import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";

describe("Configuration", () => {
  const mockCurrency: CryptoCurrency = {
    id: "sui",
    name: "sui",
    family: "sui",
    units: [],
    type: "CryptoCurrency",
    ticker: "sui",
    managerAppName: "Sui",
    coinType: 784,
    scheme: "sui",
    color: "#000000",
    explorerViews: [],
  };

  const baseConfig = {
    node: { url: "123", graphqlUrl: "456" },
    status: { type: "active" as const },
    features: { graphql: false },
  };

  beforeEach(() => {
    // Reset the config before each test
    coinConfig.setCoinConfig(() => baseConfig);
  });

  describe("getCoinConfig", () => {
    it("should return default config when no currency is provided", () => {
      const config = coinConfig.getCoinConfig();
      expect(config).toEqual(baseConfig);
    });

    it("should return config for specific currency", () => {
      const config = coinConfig.getCoinConfig(mockCurrency.id);
      expect(config).toEqual(baseConfig);
    });
  });
});
