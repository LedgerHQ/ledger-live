import { getCryptoAssetsStore, setCryptoAssetsStore } from ".";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import * as calIntegration from "./cal-integration";

describe("Testing CryptoAssetStore", () => {
  let isCALIntegrationEnabledSpy: jest.SpyInstance;
  let getCALStoreSpy: jest.SpyInstance;

  beforeEach(() => {
    isCALIntegrationEnabledSpy = jest
      .spyOn(calIntegration, "isCALIntegrationEnabled")
      .mockReturnValue(false);
    getCALStoreSpy = jest.spyOn(calIntegration, "getCALStore");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("returns legacy store by default when CAL integration disabled and no custom store set", () => {
    const store = getCryptoAssetsStore();
    expect(store).toEqual({
      findTokenByAddress: legacy.findTokenByAddress,
      getTokenById: legacy.getTokenById,
      findTokenById: legacy.findTokenById,
      findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
      findTokenByTicker: legacy.findTokenByTicker,
    });
  });

  it("returns the custom store when one is set and CAL integration is disabled", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const newStore = {} as unknown as CryptoAssetsStore;
    setCryptoAssetsStore(newStore);

    const store = getCryptoAssetsStore();
    expect(store).toBe(newStore);
  });

  it("should return CAL store when CAL integration is enabled", () => {
    isCALIntegrationEnabledSpy.mockReturnValue(true);

    const mockCALStore = {} as unknown as CryptoAssetsStore;
    getCALStoreSpy.mockReturnValue(mockCALStore);

    const store = getCryptoAssetsStore();

    expect(isCALIntegrationEnabledSpy).toHaveBeenCalled();
    expect(getCALStoreSpy).toHaveBeenCalled();
    expect(store).toBe(mockCALStore);
  });

  it("prioritizes CAL integration over any custom store", () => {
    isCALIntegrationEnabledSpy.mockReturnValue(true);

    const mockCALStore = {} as unknown as CryptoAssetsStore;
    getCALStoreSpy.mockReturnValue(mockCALStore);

    const store = getCryptoAssetsStore();

    expect(store).toBe(mockCALStore);
    expect(isCALIntegrationEnabledSpy).toHaveBeenCalled();
    expect(getCALStoreSpy).toHaveBeenCalled();
  });
});
