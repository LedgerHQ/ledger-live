import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration } from ".";
import liveConfig from "./sharedConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

describe("getCurrencyConfiguration", () => {
  const cosmosCurrencyMock = {
    family: "cosmos",
    id: "cosmos",
  } as CryptoCurrency;
  LiveConfig.setConfig(liveConfig);
  describe("when config fetching is successful", () => {
    it("should return the related currency config", async () => {
      const config = getCurrencyConfiguration(cosmosCurrencyMock);
      expect(config).toEqual(liveConfig.cosmos.default);
    });
  });

  describe("when config fetching fails", () => {
    it("should return an error if currency isn't defined in local config", async () => {
      expect(() =>
        getCurrencyConfiguration({
          id: "idontexistasacurrency",
          family: "ihavenofamily",
        } as unknown as CryptoCurrency),
      ).toThrow(Error);
    });
  });
});
