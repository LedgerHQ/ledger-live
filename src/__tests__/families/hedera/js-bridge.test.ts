import Bridge from "../../../families/hedera/bridge/js";
import type { CryptoCurrency } from "@ledgerhq/cryptoassets";

const crypto: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "",
  managerAppName: "",
  coinType: 0,
  scheme: "",
  color: "",
  family: "",
  explorerViews: [],
  name: "",
  ticker: "",
  units: [],
};

describe("js-bridge", () => {
  describe("currencyBridge", () => {
    test("preload", async () => {
      const result = await Bridge.currencyBridge.preload(crypto);

      expect(result).toEqual({});
    });

    test("hydrate", () => {
      const result = Bridge.currencyBridge.hydrate({}, crypto);

      expect(result).toBe(undefined);
    });
  });
});
