import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration } from ".";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

describe("getCurrencyConfiguration", () => {
  let getValueByKeySpy: jest.SpyInstance;

  beforeEach(() => {
    getValueByKeySpy = jest.spyOn(LiveConfig, "getValueByKey");
  });

  describe("when config fetching is successful", () => {
    it("should return the related currency config", async () => {
      const cosmosCurrencyMock = {
        family: "cosmos",
        id: "cosmos",
      } as CryptoCurrency;
      getValueByKeySpy.mockReturnValueOnce(cosmosCurrencyMock);
      const config = getCurrencyConfiguration(cosmosCurrencyMock);
      expect(config).toEqual(cosmosCurrencyMock);
    });
  });

  it("should return an error if currency config is null", async () => {
    getValueByKeySpy.mockReturnValueOnce(null);
    expect(() =>
      getCurrencyConfiguration({
        id: "idontexistasacurrency",
        family: "ihavenofamily",
      } as unknown as CryptoCurrency),
    ).toThrow(Error);
  });
});
