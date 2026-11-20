import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../../config";
import {
  cardanoConfig,
  getCardanoCoinConfig,
  setCardanoKeychainObservableRangeSource,
} from "./config";

const remoteKeychainObservableRange = (keychainObservableRange: number) =>
  LiveConfig.setProvider({
    getValueByKey: (key: string) =>
      key.startsWith("config_currency_cardano") ? { keychainObservableRange } : undefined,
  });

describe("cardanoConfig", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(cardanoConfig);
    LiveConfig.instance.provider = undefined;
    LiveConfig.setAllOverrides({});
    setCardanoKeychainObservableRangeSource();
  });

  afterEach(() => {
    LiveConfig.setAllOverrides({});
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
    setCardanoKeychainObservableRangeSource();
  });

  it.each(["cardano", "cardano_testnet"])(
    "uses the default keychain observable range for %s",
    currencyId => {
      expect(getCardanoCoinConfig(currencyId)).toEqual(getCurrencyConfiguration(currencyId));
      expect(getCardanoCoinConfig(currencyId)).toMatchObject({ keychainObservableRange: 20 });
    },
  );

  it.each(["cardano", "cardano_testnet"])(
    "uses the user keychain observable range for %s over the remote one",
    currencyId => {
      remoteKeychainObservableRange(30);
      setCardanoKeychainObservableRangeSource(() => 50);

      expect(getCardanoCoinConfig(currencyId)).toMatchObject({ keychainObservableRange: 50 });
    },
  );

  it("uses the user keychain observable range when it is lower than the remote one", () => {
    remoteKeychainObservableRange(30);
    setCardanoKeychainObservableRangeSource(() => 25);

    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 25 });
  });

  it.each([undefined, 0, -1, 2.5, NaN])(
    "uses the remote keychain observable range when the user gives %p",
    userRange => {
      remoteKeychainObservableRange(30);
      setCardanoKeychainObservableRangeSource(() => userRange);

      expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 30 });
    },
  );

  it("uses the default keychain observable range when the user gives no value and there is no remote one", () => {
    setCardanoKeychainObservableRangeSource(() => undefined);

    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 20 });
  });

  it("lets a live config override of the keychain observable range win over the user one", () => {
    remoteKeychainObservableRange(30);
    setCardanoKeychainObservableRangeSource(() => 50);
    LiveConfig.setOverride("config_currency_cardano", { keychainObservableRange: 100 });

    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 100 });
  });

  it("uses the user keychain observable range when a live config override sets other values", () => {
    setCardanoKeychainObservableRangeSource(() => 50);
    LiveConfig.setOverride("config_currency_cardano", { maxFeesWarning: 1 });

    expect(getCardanoCoinConfig("cardano")).toMatchObject({
      keychainObservableRange: 50,
      maxFeesWarning: 1,
    });
  });

  it("reads the user keychain observable range on every read", () => {
    let userRange: number | undefined = 50;
    setCardanoKeychainObservableRangeSource(() => userRange);

    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 50 });

    userRange = 80;
    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 80 });

    userRange = undefined;
    expect(getCardanoCoinConfig("cardano")).toMatchObject({ keychainObservableRange: 20 });
  });

  it("keeps the other values when the user sets the keychain observable range", () => {
    setCardanoKeychainObservableRangeSource(() => 50);

    expect(getCardanoCoinConfig("cardano_testnet")).toMatchObject({
      maxFeesWarning: 5e6,
      maxFeesError: 10e6,
      testnet: true,
      api: { url: "https://ledger-preprod.cardanoscan.io/api" },
    });
  });
});
