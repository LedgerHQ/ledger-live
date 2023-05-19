import { EthStakingProviders } from "~/types/featureFlags";
import { getV2ListProviders } from "./getV2ListProviders";

type ListProviders = EthStakingProviders["listProvider"];

describe("getV2ListProviders function", () => {
  it("should return an empty array if listProvider is empty", () => {
    const providers: ListProviders = [];
    const result = getV2ListProviders(providers);
    expect(result).toEqual([]);
  });

  it("should return an empty array if all providers are of type ProviderType1", () => {
    const providers: ListProviders = [
      { name: "provider1", minAccountBalance: 10, liveAppId: "app1", supportLink: "link1" },
      { name: "provider2", minAccountBalance: 20, liveAppId: "app2", supportLink: "link2" },
    ];
    const result = getV2ListProviders(providers);
    expect(result).toEqual([]);
  });

  it("should return an array of type ProviderType2 if all providers are of type ProviderType2", () => {
    const providers: ListProviders = [
      { id: "1", name: "provider1", liveAppId: "app1" },
      { id: "2", name: "provider2", liveAppId: "app2", supportLink: "link2" },
    ];
    const result = getV2ListProviders(providers);
    expect(result).toEqual(providers);
  });

  it("should filter out ProviderType1 items from a mixed array", () => {
    const providers: ListProviders = [
      { name: "provider1", minAccountBalance: 10, liveAppId: "app1", supportLink: "link1" },
      { id: "1", name: "provider1", liveAppId: "app1" },
      { id: "2", name: "provider2", liveAppId: "app2", supportLink: "link2" },
    ];

    const result = getV2ListProviders(providers);
    expect(result).toEqual([
      { id: "1", name: "provider1", liveAppId: "app1" },
      { id: "2", name: "provider2", liveAppId: "app2", supportLink: "link2" },
    ]);
  });
});
