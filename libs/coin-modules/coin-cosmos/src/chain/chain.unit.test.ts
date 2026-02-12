import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import cosmosCoinConfig, { cosmosConfig } from "../config";
import cryptoFactory from "./chain";

describe("cryptoFactory test", () => {
  beforeAll(() => {
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currency => LiveConfig.getValueByKey(`config_currency_${currency?.id}`) ?? {},
    );
  });

  it("should not return null with currencies in cosmos family", () => {
    const currencies = [
      "cosmos",
      "osmosis",
      "osmo",
      "axelar",
      "binance_beacon_chain",
      "coreum",
      "desmos",
      "dydx",
      "nyx",
      "onomy",
      "persistence",
      "quicksilver",
      "secret_network",
      "stargaze",
      "stride",
      "mantra",
      "crypto_org",
      "xion",
      "zenrock",
      "babylon",
    ];
    currencies.forEach(currency => {
      expect(cryptoFactory(currency)).not.toBeNull();
    });
  });

  it("should throw an error when currency id is unknown", () => {
    expect(() => cryptoFactory("unknown")).toThrow();
  });
});
