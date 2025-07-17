import { LiveConfig } from "@ledgerhq/live-config/lib/LiveConfig";
import { getCryptoAssetsStore, setCryptoAssetsStore } from ".";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import { CryptoAssetsStore } from "./type";

describe("Testing CryptoAssetStore", () => {
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
});
