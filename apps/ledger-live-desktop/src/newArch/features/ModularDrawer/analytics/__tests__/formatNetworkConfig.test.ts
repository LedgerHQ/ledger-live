import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatNetworksConfig } from "../utils";

describe("formatNetworksConfig", () => {
  it("should return default values when networksConfig is undefined", () => {
    const result = formatNetworksConfig(undefined);
    expect(result).toEqual({
      balance: false,
      numberOfAccounts: false,
      numberOfAccountsAndApy: false,
    });
  });

  it("should return correct values based on networksConfig", () => {
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      leftElement: "numberOfAccounts",
      rightElement: "balance",
    };
    const result = formatNetworksConfig(networksConfig);
    expect(result).toEqual({
      balance: true,
      numberOfAccounts: true,
      numberOfAccountsAndApy: false,
    });
  });

  it("should handle empty networksConfig", () => {
    const result = formatNetworksConfig({});
    expect(result).toEqual({
      balance: false,
      numberOfAccounts: false,
      numberOfAccountsAndApy: false,
    });
  });

  it("should handle networksConfig with only some properties defined", () => {
    const networksConfig: EnhancedModularDrawerConfiguration["networks"] = {
      rightElement: "balance",
    };
    const result = formatNetworksConfig(networksConfig);
    expect(result).toEqual({
      balance: true,
      numberOfAccountsAndApy: false,
      numberOfAccounts: false,
    });
  });
});
