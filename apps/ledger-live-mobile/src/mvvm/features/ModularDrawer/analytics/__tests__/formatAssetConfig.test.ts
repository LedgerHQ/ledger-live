import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig } from "../utils";

describe("formatAssetsConfig", () => {
  it("should return default values when assetsConfig is undefined", () => {
    const result = formatAssetsConfig(undefined);
    expect(result).toEqual({
      balance: false,
      market_trend: false,
      apy: false,
      filter: false,
    });
  });

  it("should return correct values based on assetsConfig", () => {
    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      rightElement: "balance",
      leftElement: "apy",
      filter: "topNetworks",
    };
    const result = formatAssetsConfig(assetsConfig);
    expect(result).toEqual({
      balance: true,
      market_trend: false,
      apy: true,
      filter: true,
    });
  });

  it("should handle empty assetsConfig", () => {
    const result = formatAssetsConfig({});
    expect(result).toEqual({
      balance: false,
      market_trend: false,
      apy: false,
      filter: false,
    });
  });

  it("should handle assetsConfig with only some properties defined", () => {
    const assetsConfig: EnhancedModularDrawerConfiguration["assets"] = {
      rightElement: "marketTrend",
    };
    const result = formatAssetsConfig(assetsConfig);
    expect(result).toEqual({
      balance: false,
      market_trend: true,
      apy: false,
      filter: false,
    });
  });
});
