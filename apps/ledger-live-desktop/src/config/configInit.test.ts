import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import {
  getCardanoCoinConfig,
  setCardanoKeychainObservableRangeSource,
} from "@ledgerhq/live-common/families/cardano/config";

describe("configInit", () => {
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeAll(async () => {
    await import("./configInit");
  });

  beforeEach(() => {
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setProvider({
      getValueByKey: (key: string) =>
        key === "config_currency_cardano" ? { keychainObservableRange: 30 } : undefined,
    });
    window.localStorage.removeItem("experimentalFlags");
  });

  afterEach(() => {
    LiveConfig.instance.provider = savedProvider;
  });

  afterAll(() => {
    window.localStorage.removeItem("experimentalFlags");
    LiveConfig.setConfig(liveConfig);
    setCardanoKeychainObservableRangeSource();
  });

  it("uses the remote Cardano gap limit when no custom gap limit is set", () => {
    expect(getCardanoCoinConfig("cardano").keychainObservableRange).toBe(30);
  });

  it("applies the experimental custom gap limit to Cardano over the remote one", () => {
    window.localStorage.setItem(
      "experimentalFlags",
      JSON.stringify({ KEYCHAIN_OBSERVABLE_RANGE: 50 }),
    );

    expect(getCardanoCoinConfig("cardano").keychainObservableRange).toBe(50);
  });

  it("uses the remote Cardano gap limit when the custom gap limit is turned off", () => {
    window.localStorage.setItem(
      "experimentalFlags",
      JSON.stringify({ KEYCHAIN_OBSERVABLE_RANGE: 0 }),
    );

    expect(getCardanoCoinConfig("cardano").keychainObservableRange).toBe(30);
  });

  it("uses the default Cardano gap limit without remote config nor custom gap limit", () => {
    LiveConfig.instance.provider = undefined;

    expect(getCardanoCoinConfig("cardano").keychainObservableRange).toBe(20);
  });

  it("keeps the shared live config", () => {
    expect(LiveConfig.getDefaultValueByKey("config_currency_ethereum")).toEqual(
      liveConfig.config_currency_ethereum.default,
    );
  });
});
