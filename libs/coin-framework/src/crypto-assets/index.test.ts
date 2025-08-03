import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoAssetsStore, setCryptoAssetsStore } from "./index";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import { CryptoAssetsStore } from "./type";

describe("CryptoAssetStore", () => {
  it.each([
    [
      "feature flag does not exist",
      {
        some_other_config: {
          type: "boolean",
          default: false,
        },
      },
    ],
    [
      "feature flag is disabled",
      {
        feature_cal_lazy_loading: {
          type: "boolean",
          default: false,
        },
      },
    ],
  ] as const)("returns the default methods from cryptoassets libs when %s", (_, config) => {
    LiveConfig.setConfig(config);

    expect(getCryptoAssetsStore()).toEqual({
      findTokenByAddress: legacy.findTokenByAddress,
      getTokenById: legacy.getTokenById,
      findTokenById: legacy.findTokenById,
      findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
      findTokenByTicker: legacy.findTokenByTicker,
    });
  });

  it("throws an error when no store is set and feature flag is enabled", () => {
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

  it("returns the new store when feature flag is enabled", () => {
    LiveConfig.setConfig({
      feature_cal_lazy_loading: {
        type: "boolean",
        default: true,
      },
    });

    setCryptoAssetsStore({} as unknown as CryptoAssetsStore);

    expect(getCryptoAssetsStore()).toEqual({});
  });
});
