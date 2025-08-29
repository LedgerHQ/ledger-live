import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
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
  it("should return the default methods from cryptoassets libs when feature flag does not exists", () => {
    LiveConfig.setConfig({
      some_other_feature: {
        type: "boolean",
        default: true,
      },
    });

    const store = getCryptoAssetsStore();
    expect(store).toEqual({
      findTokenByAddress: legacy.findTokenByAddress,
      getTokenById: legacy.getTokenById,
      findTokenById: legacy.findTokenById,
      findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
      findTokenByTicker: legacy.findTokenByTicker,
    });
  });

  it("should return the default methods from cryptoassets libs when feature flag is disabled", () => {
    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: false,
      },
    });

    const store = getCryptoAssetsStore();
    expect(store).toEqual({
      findTokenByAddress: legacy.findTokenByAddress,
      getTokenById: legacy.getTokenById,
      findTokenById: legacy.findTokenById,
      findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
      findTokenByTicker: legacy.findTokenByTicker,
    });
  });

  it("should throw an error when no store is set and feature flag is enabled", () => {
    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: true,
      },
    });

    expect(() => getCryptoAssetsStore()).toThrow(
      "CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.",
    );
  });

  it("should throw return the new store when feature flag is enabled", () => {
    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: true,
      },
    });

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

  it("should prioritize CAL integration over feature flags", () => {
    isCALIntegrationEnabledSpy.mockReturnValue(true);

    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: true,
      },
    });

    const mockCALStore = {} as unknown as CryptoAssetsStore;
    getCALStoreSpy.mockReturnValue(mockCALStore);

    const store = getCryptoAssetsStore();

    expect(store).toBe(mockCALStore);
    expect(isCALIntegrationEnabledSpy).toHaveBeenCalled();
    expect(getCALStoreSpy).toHaveBeenCalled();
  });
});
