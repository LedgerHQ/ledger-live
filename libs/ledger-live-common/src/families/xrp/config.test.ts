import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getXrpEnabledTokenStandards, xrpConfig } from "./config";

const makeCurrency = (id: string) => ({ id }) as CryptoCurrency;

describe("getXrpEnabledTokenStandards", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(xrpConfig);
    LiveConfig.instance.provider = undefined;
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it.each(["ripple", "ripple_devnet"])("enables no standard on %s by default", id => {
    expect(getXrpEnabledTokenStandards(makeCurrency(id))).toEqual([]);
  });

  it("enables IOU and MPT on ripple_testnet by default", () => {
    expect(getXrpEnabledTokenStandards(makeCurrency("ripple_testnet"))).toEqual(["iou", "mpt"]);
  });

  it("reads the standards the remote currency config sets", () => {
    LiveConfig.setProvider({
      getValueByKey: (key: string) => {
        return key === "config_currency_ripple" ? { enabledTokenStandards: ["iou"] } : undefined;
      },
    });

    expect(getXrpEnabledTokenStandards(makeCurrency("ripple"))).toEqual(["iou"]);
  });
});
