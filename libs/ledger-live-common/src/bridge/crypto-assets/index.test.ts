import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoAssetsStore, setCryptoAssetsStore } from ".";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";

describe("Testing CryptoAssetStore", () => {
  it("should return the default methods from cryptoassets libs when feature flag does not exists", () => {
    LiveConfig.setConfig({
      some_other_feature: {
        type: "boolean",
        default: true,
      },
    });

    const store = getCryptoAssetsStore();
    expect(store).toBe(legacyCryptoAssetsStore);
  });

  it("should return the default methods from cryptoassets libs when feature flag is disabled", () => {
    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: false,
      },
    });

    const store = getCryptoAssetsStore();
    expect(store).toBe(legacyCryptoAssetsStore);
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
