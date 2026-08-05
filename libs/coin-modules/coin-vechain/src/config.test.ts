import { MissingCoinConfig } from "@ledgerhq/coin-module-framework/errors";
import { getChainTag, getCoinConfig, setCoinConfig } from "./config";
import { MAINNET_CHAIN_TAG } from "./types";

describe("config", () => {
  it("throws MissingCoinConfig when no config has been set", () => {
    // The shared test setup installs a config for every suite, so a fresh module instance is
    // needed to observe the unconfigured state.
    jest.isolateModules(() => {
      // Both come from the isolated registry: the error class identity differs across registries.
      const { getCoinConfig: unconfigured } = require("./config");
      const {
        MissingCoinConfig: IsolatedMissingCoinConfig,
      } = require("@ledgerhq/coin-module-framework/errors");

      expect(() => unconfigured()).toThrow(IsolatedMissingCoinConfig);
    });
  });

  it("returns the config as set, without a chainTag when the currency config omits it", () => {
    setCoinConfig(() => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
    }));

    expect(getCoinConfig()).toEqual({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
    });
    expect(getCoinConfig().chainTag).toBeUndefined();
  });

  it("returns the configured chainTag when the currency config provides one", () => {
    setCoinConfig(() => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
      chainTag: 39,
    }));

    expect(getCoinConfig().chainTag).toBe(39);
  });
});

describe("getChainTag", () => {
  it("returns the configured chainTag when it is a valid single byte", () => {
    setCoinConfig(() => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
      chainTag: 39,
    }));

    expect(getChainTag()).toBe(39);
  });

  it("falls back to mainnet when the currency config omits a chainTag", () => {
    setCoinConfig(() => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
    }));

    expect(getChainTag()).toBe(MAINNET_CHAIN_TAG);
  });

  it.each([-1, 256, 74.5, NaN])(
    "falls back to mainnet for an out-of-range or non-integer chainTag (%p)",
    invalid => {
      setCoinConfig(() => ({
        status: { type: "active" },
        node: { url: "https://vechain.coin.ledger.com" },
        chainTag: invalid,
      }));

      expect(getChainTag()).toBe(MAINNET_CHAIN_TAG);
    },
  );
});
