import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCurrencyConfiguration } from "../../config";
import { tronConfig } from "./config";

const TRONIFY_PROXY_URL = "https://tronify.api.live.ledger.com";

describe("tronConfig", () => {
  let savedConfig: typeof LiveConfig.instance.config;
  let savedProvider: typeof LiveConfig.instance.provider;

  beforeEach(() => {
    savedConfig = LiveConfig.instance.config;
    savedProvider = LiveConfig.instance.provider;
    LiveConfig.setConfig(tronConfig);
    LiveConfig.instance.provider = undefined;
  });

  afterEach(() => {
    LiveConfig.setConfig(savedConfig);
    LiveConfig.instance.provider = savedProvider;
  });

  it("ships the Tronify provider at the Ledger proxy, with the payee check on and no sourceFlag", () => {
    expect(getCurrencyConfiguration("tron").energyRent).toEqual({
      provider: "tronify",
      tronify: { url: TRONIFY_PROXY_URL, enforcePaymentAddresses: true },
    });
  });

  it("keeps the default url when the remote config supplies only the sourceFlag", () => {
    LiveConfig.setProvider({
      getValueByKey: () => ({ energyRent: { tronify: { sourceFlag: "ledger-live" } } }),
    });

    expect(getCurrencyConfiguration("tron").energyRent).toEqual({
      provider: "tronify",
      tronify: { url: TRONIFY_PROXY_URL, enforcePaymentAddresses: true, sourceFlag: "ledger-live" },
    });
  });

  it("lets the remote config turn the payee check off", () => {
    LiveConfig.setProvider({
      getValueByKey: () => ({ energyRent: { tronify: { enforcePaymentAddresses: false } } }),
    });

    expect(getCurrencyConfiguration("tron").energyRent).toEqual({
      provider: "tronify",
      tronify: { url: TRONIFY_PROXY_URL, enforcePaymentAddresses: false },
    });
  });
});
