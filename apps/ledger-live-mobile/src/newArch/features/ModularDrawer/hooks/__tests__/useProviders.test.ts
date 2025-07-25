import { renderHook } from "@tests/test-renderer";
import { getProvider, useProviders } from "../useProviders";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { providers } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";

describe("getProvider", () => {
  it("should return the provider containing the given currency", () => {
    const result = getProvider(mockEthCryptoCurrency, providers);
    expect(result).toBe(providers[1]);
  });
});

describe("useProviders", () => {
  it("getNetworksFromProvider should return correct network ids", () => {
    const { result } = renderHook(() => useProviders());
    const provider = providers[1]; //ETH
    const ids = ["ethereum", "arbitrum"];
    const networks = result.current.getNetworksFromProvider(provider, ids);
    expect(networks).toEqual(ids);
  });
});
