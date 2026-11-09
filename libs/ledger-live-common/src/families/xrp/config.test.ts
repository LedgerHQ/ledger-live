import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getXrpEnabledTokenStandards, xrpConfig } from "./config";

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

  it.each(["ripple", "ripple_testnet", "ripple_devnet"])("enables none on %s by default", id => {
    expect(getXrpEnabledTokenStandards(id)).toEqual([]);
  });

  it("keeps known standards once each, sorted", () => {
    LiveConfig.setProvider({
      getValueByKey: (key: string) => {
        return key === "config_currency_ripple"
          ? { enabledTokenStandards: ["mpt", "erc20", "iou", "mpt"] }
          : undefined;
      },
    });

    expect(getXrpEnabledTokenStandards("ripple")).toEqual(["iou", "mpt"]);
  });
});
